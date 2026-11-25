#!/usr/bin/env python3
"""File 62: byte-level reproducibility and *descriptive*, not object-identity, tests."""
from __future__ import annotations
import argparse, hashlib, json, math, mmap, statistics, struct
from collections import defaultdict
from pathlib import Path

HERE=Path(__file__).resolve().parent
EXPECTED={
    "splat_bytes":5892736,
    "splat_count":184148,
    "splat_git_blob":"461f56d8d5d3e05daa63bae7c84524f666b7af09",
    "ply_bytes":45670235,
    "ply_git_blob":"b03f134079e7396f3aef074e05380442bfe25243",
    "original_bytes":24859995,
    "original_sha256":"c945b02e56ee9ecc649149c854f235cfd305a896d86e38a334a97f6111e57fae",
    "figure_count":1414
}
REGIONS={
    "figure":(6,7.9,-4.6,-1,21,24),
    "left_control":(3.8,5.7,-4.6,-1,21,24),
    "right_control":(8.2,10.1,-4.6,-1,21,24)
}

def sha256(path):
    h=hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):h.update(chunk)
    return h.hexdigest()

def git_blob(path):
    h=hashlib.sha1()
    h.update(("blob %s\0"%path.stat().st_size).encode())
    with path.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):h.update(chunk)
    return h.hexdigest()

def inside(pos,box):
    x,y,z=pos
    x0,x1,y0,y1,z0,z1=box
    return x0<x<x1 and y0<y<y1 and z0<z<z1

def median(xs):
    return statistics.median(xs) if xs else None

def covariance(points):
    n=len(points)
    if n<3:return None
    mean=[sum(p[j] for p in points)/n for j in range(3)]
    mat=[[sum((p[i]-mean[i])*(p[j]-mean[j]) for p in points)/n for j in range(3)] for i in range(3)]
    # Jacobi eigenvalues for symmetric 3x3, with deterministic pivot order.
    a=[row[:] for row in mat]
    for _ in range(64):
        i,j=max(((0,1),(0,2),(1,2)),key=lambda pair: abs(a[pair[0]][pair[1]]))
        if abs(a[i][j])<1e-12:break
        angle=0.5*math.atan2(2*a[i][j],a[j][j]-a[i][i])
        c=math.cos(angle);s=math.sin(angle)
        for k in range(3):
            if k in (i,j):continue
            aik,ajk=a[i][k],a[j][k]
            a[i][k]=a[k][i]=c*aik-s*ajk
            a[j][k]=a[k][j]=s*aik+c*ajk
        ai,aj,aij=a[i][i],a[j][j],a[i][j]
        a[i][i]=c*c*ai+s*s*aj-2*s*c*aij
        a[j][j]=s*s*ai+c*c*aj+2*s*c*aij
        a[i][j]=a[j][i]=0
    eigen=sorted([max(0,a[i][i]) for i in range(3)])
    total=sum(eigen)
    return {"mean":mean,"eigenvalues_ascending":eigen,
            "smallest_fraction":eigen[0]/total if total else None,
            "warning":"Point-center PCA is sensitive to the user-defined selection box; it does not prove a flat surface."}

def connected(points,radius):
    n=len(points)
    if n==0:return {"radius":radius,"components":0,"largest":0,"largest_fraction":None}
    parent=list(range(n));size=[1]*n
    def root(i):
        while parent[i]!=i:
            parent[i]=parent[parent[i]]
            i=parent[i]
        return i
    def union(a,b):
        a=root(a);b=root(b)
        if a==b:return
        if size[a]<size[b]:a,b=b,a
        parent[b]=a;size[a]+=size[b]
    cells=defaultdict(list)
    r2=radius*radius
    for i,p in enumerate(points):
        cell=tuple(math.floor(v/radius) for v in p)
        for dx in (-1,0,1):
            for dy in (-1,0,1):
                for dz in (-1,0,1):
                    for j in cells[(cell[0]+dx,cell[1]+dy,cell[2]+dz)]:
                        q=points[j]
                        if sum((p[k]-q[k])**2 for k in range(3))<=r2:union(i,j)
        cells[cell].append(i)
    comps=defaultdict(int)
    for i in range(n):comps[root(i)]+=1
    largest=max(comps.values())
    return {"radius":radius,"components":len(comps),"largest":largest,
            "largest_fraction":largest/n,
            "warning":"Connected point centers do not establish solid matter, anatomy, or structural continuity."}

def analyze(splat_path,ply_path,original_path):
    pstat={}
    for name,path in [("splat",splat_path),("ply",ply_path),("original",original_path)]:
        pstat[name]={"path":str(path),"bytes":path.stat().st_size,"sha256":sha256(path),
                     "git_blob_sha1":git_blob(path)}
    for name in ("splat","ply","original"):
        assert pstat[name]["bytes"]==EXPECTED[name+"_bytes"],f"Unexpected {name} size"
    assert pstat["splat"]["git_blob_sha1"]==EXPECTED["splat_git_blob"],"SPLAT Git object mismatch"
    assert pstat["ply"]["git_blob_sha1"]==EXPECTED["ply_git_blob"],"PLY Git object mismatch"
    assert pstat["original"]["sha256"]==EXPECTED["original_sha256"],"Original SHA256 differs from published case"
    regions={name:{"xyz":[],"alphas":[]} for name in REGIONS}
    fog=0;valid=0
    with splat_path.open("rb") as fh:
        with mmap.mmap(fh.fileno(),0,access=mmap.ACCESS_READ) as m:
            n=len(m)//32
            assert len(m)%32==0 and n==EXPECTED["splat_count"]
            for i in range(n):
                off=i*32
                xyz=struct.unpack_from("<fff",m,off)
                if not all(math.isfinite(x) for x in xyz):continue
                valid+=1
                alpha=m[off+27]/255.
                in_figure=inside(xyz,REGIONS["figure"])
                if 15<xyz[2]<32 and math.atan2(xyz[0],xyz[2])>math.radians(2) and not in_figure:
                    fog+=1
                for name,box in REGIONS.items():
                    if inside(xyz,box):
                        regions[name]["xyz"].append(xyz)
                        regions[name]["alphas"].append(alpha)
    output={"source_identifiers":pstat,"record_count":n,"valid_xyz":valid,
            "published_zoom_fog_mask_count":fog,"analysis":{}}
    for name,r in regions.items():
        points,alpha=r["xyz"],r["alphas"]
        out={"count":len(points),"median_opacity":median(alpha),
             "counts_after_opacity_filter":{str(t):sum(a>=t for a in alpha) for t in (0,0.25,0.5,0.75)},
             "xyz_covariance":covariance(points),
             "connectivity_point_centers":[connected(points,r) for r in (0.15,0.30,0.60)]}
        output["analysis"][name]=out
    assert output["analysis"]["figure"]["count"]==EXPECTED["figure_count"],"Published figure-count mismatch"
    output["interpretive_limitations"]=[
       "Opacity and connected components are descriptive measurements only.",
       "Neighboring equal-volume boxes need not have matching point density, scale or opacity.",
       "Large viewing-angle distortions can occur in legitimate single-view reconstructions.",
       "No evidence identifies the selected cluster as a human, a building, or a physical recording."
    ]
    return output

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--splat",default=str(HERE/"data/file62.splat"))
    ap.add_argument("--ply",default=str(HERE/"data/file62.ply"))
    ap.add_argument("--original",default=str(HERE/"../../20180208_1142.bin"))
    ap.add_argument("--output",default=str(HERE/"analysis-results.json"))
    args=ap.parse_args()
    report=analyze(Path(args.splat),Path(args.ply),Path(args.original))
    Path(args.output).write_text(json.dumps(report,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    print(json.dumps({k:{"count":v["count"],"median_opacity":v["median_opacity"]} for k,v in report["analysis"].items()},indent=2))
    print("File integrity verified. Report:",args.output)

if __name__=="__main__":
    main()
