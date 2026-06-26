"""Re-sync the TecnoPark building from Blender to the web app.

Run this AFTER moving / scaling / editing the TecnoPark in smartcity-master.blend
so the website (smartcity-index.html) matches Blender. It:

  1. bakes a per-vertex `_ifc_index` POINT attribute on every SC_TECHNOPARK
     visual_chunk (from the FACE `ifc_index`), so the web can pick each element;
  2. exports SC_TECHNOPARK -> technopark.glb (Draco-compressed, transform baked
     with +Y up), into smartcity-ioc/assets/models/smartcity/;
  3. rebuilds technopark-ifc-map.json (IOC info per element, enriched from the
     IFC SQLite DB).

Usage (with smartcity-master.blend open in Blender), from the Text Editor / console:
    exec(open(r"<repo>/scripts/blender/export_technopark_to_web.py").read())
or headless:
    blender smartcity-master.blend --background --python scripts/blender/export_technopark_to_web.py

NOTE: bump SMARTCITY_MODEL_VERSION in assets/js/scene/smartcity-scene-runtime.js
(or hard-refresh) so the browser drops the cached technopark.glb.
"""

import json
import os
import sqlite3
import tempfile
import time

import bpy
import mathutils

# --- paths (the blue-glass TecnoPark source lives in the IFC_TecknoPark project) ---
TECHNOPARK_COLLECTION = "SC_TECHNOPARK"
TECHNOPARK_ROOT = "TECHNOPARK_ROOT"
# Blender Z-up -> glTF/three.js Y-up: point (x, y, z) -> (x, z, -y) (rot -90° about X).
_YUP = mathutils.Matrix(((1, 0, 0, 0), (0, 0, 1, 0), (0, -1, 0, 0), (0, 0, 0, 1)))
FACE_ATTRIBUTE = "ifc_index"
POINT_ATTRIBUTE = "_ifc_index"
IFC_PROJECT = r"C:\Users\Administrator\Documents\Projects\IFC_TecknoPark"
SOURCE_IFCMAP = os.path.join(IFC_PROJECT, "TecnoPark_GLB_FACADE_BLUE_GLASS_FAST_EDIT.ifcmap.json")
SQLITE_DB = os.path.join(IFC_PROJECT, "ifc_metadata.sqlite")
WEB_MODELS = os.path.join(
    bpy.path.abspath(bpy.context.scene.get("smartcity_web_model_dir", ""))
    or os.path.join(os.path.dirname(bpy.data.filepath), "..", "models", "smartcity")
)
GLB_OUT = os.path.normpath(os.path.join(WEB_MODELS, "technopark.glb"))
MAP_OUT = os.path.normpath(os.path.join(WEB_MODELS, "technopark-ifc-map.json"))
TRANSFORM_OUT = os.path.normpath(os.path.join(WEB_MODELS, "technopark-transform.json"))


def write_transform():
    """Placement matrix (Y-up) applied by the web to the geometry-only GLB."""
    root = bpy.data.objects.get(TECHNOPARK_ROOT)
    if root is None:
        return None
    matrix = _YUP @ root.matrix_world @ _YUP.inverted()
    elements = [round(matrix[r][c], 6) for c in range(4) for r in range(4)]  # column-major
    with open(TRANSFORM_OUT, "w", encoding="utf-8") as f:
        json.dump({"matrix": elements}, f)
    return elements


def load_offsets():
    """Assign every IFC element a GLOBAL id (so geometry can be merged by material
    on the web without per-chunk index collisions). offset[chunkKey] = where that
    chunk's elements start in the flat list; flat = all elements concatenated."""
    data = json.loads(open(SOURCE_IFCMAP, encoding="utf-8").read())
    chunks_meta = data["chunks"]
    offset, flat = {}, []
    for ck in sorted(chunks_meta.keys()):
        offset[ck] = len(flat)
        flat.extend(dict(e) for e in chunks_meta[ck])
    return offset, flat


def bake_point_indices(chunks, offset):
    made = 0
    for ch in chunks:
        me = ch.data
        fa = me.attributes.get(FACE_ATTRIBUTE)
        if fa is None:
            continue
        off = offset.get(str(ch.get("FAST_ChunkKey", "")), 0)
        if POINT_ATTRIBUTE in me.attributes:
            me.attributes.remove(me.attributes[POINT_ATTRIBUTE])
        pa = me.attributes.new(name=POINT_ATTRIBUTE, type="INT", domain="POINT")
        vals = [0] * len(me.vertices)
        for poly in me.polygons:
            g = off + int(fa.data[poly.index].value)  # local index -> GLOBAL id
            for vi in poly.vertices:
                vals[vi] = g
        pa.data.foreach_set("value", vals)
        made += 1
    return made


def export_glb(col):
    objs, seen = [], set()

    def add(o):
        if o.name in seen:
            return
        seen.add(o.name)
        objs.append(o)
        for c in o.children:
            add(c)

    for o in col.objects:
        add(o)
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.hide_set(False)
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]

    # Export GEOMETRY ONLY: neutralize the root's transform so the GLB holds the
    # building at its base coords. The web re-applies the placement from
    # technopark-transform.json -> moving/scaling syncs by transform alone.
    root = bpy.data.objects.get(TECHNOPARK_ROOT)
    saved = root.matrix_basis.copy() if root else None
    if root:
        root.matrix_basis = mathutils.Matrix.Identity(4)
        bpy.context.view_layer.update()

    # write to a temp file first (the running web server may lock the live .glb)
    tmp = os.path.join(tempfile.gettempdir(), "technopark_websync.glb")
    if os.path.exists(tmp):
        os.remove(tmp)
    bpy.ops.export_scene.gltf(
        filepath=tmp, export_format="GLB", use_selection=True,
        export_yup=True, export_apply=True, export_materials="EXPORT",
        export_animations=False, export_cameras=False, export_lights=False,
        export_extras=True, export_texcoords=True, export_normals=True,
        export_tangents=False, export_attributes=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_draco_position_quantization=14,
        export_draco_normal_quantization=10,
        export_draco_generic_quantization=16,
    )
    bpy.ops.object.select_all(action="DESELECT")
    if root:
        root.matrix_basis = saved
        bpy.context.view_layer.update()
    try:
        os.replace(tmp, GLB_OUT)
    except OSError:
        # destination is locked (web server is serving it). Leave the temp copy
        # and let the caller know to stop the server / copy it manually.
        return tmp, len(objs), False
    return GLB_OUT, len(objs), True


def build_ifc_map(flat):
    """Write a FLAT element list indexed by the global id baked into _ifc_index."""
    if os.path.exists(SQLITE_DB):
        conn = sqlite3.connect(SQLITE_DB)
        conn.row_factory = sqlite3.Row
        info, oid2gid = {}, {}
        for r in conn.execute("SELECT id,global_id,type_name,storey_name,space_name FROM objects"):
            info[r["global_id"]] = {"type": r["type_name"] or "", "storey": r["storey_name"] or "", "space": r["space_name"] or ""}
            oid2gid[r["id"]] = r["global_id"]
        mats = {}
        for r in conn.execute("SELECT object_id,material_name FROM materials WHERE material_name IS NOT NULL AND material_name<>''"):
            g = oid2gid.get(r["object_id"])
            if g:
                mats.setdefault(g, []).append(r["material_name"])
        conn.close()
        for e in flat:
            d = info.get(e.get("IFC_GlobalId"))
            if d:
                e["IFC_Storey"] = d["storey"]
                e["IFC_Space"] = d["space"]
                e["IFC_TypeName"] = d["type"]
                e["IFC_Materials"] = ", ".join(sorted(set(mats.get(e["IFC_GlobalId"], []))))
                e["IOC_SQLite_Status"] = "Linked"
            else:
                e["IOC_SQLite_Status"] = "Not in SQLite"
    web = {"version": 2, "faceAttribute": FACE_ATTRIBUTE, "source": "TecnoPark_GLB_FACADE_BLUE_GLASS", "elements": flat}
    with open(MAP_OUT, "w", encoding="utf-8") as f:
        json.dump(web, f, ensure_ascii=False, separators=(",", ":"))
    return len(flat)


def main():
    t0 = time.time()
    col = bpy.data.collections.get(TECHNOPARK_COLLECTION)
    if not col:
        raise RuntimeError(f"Collection '{TECHNOPARK_COLLECTION}' not found - open smartcity-master.blend first.")
    chunks = [o for o in col.objects if o.get("FAST_Role") == "visual_chunk"]
    offset, flat = load_offsets()
    made = bake_point_indices(chunks, offset)
    glb_path, n, replaced = export_glb(col)
    total = build_ifc_map(flat)
    transform = write_transform()
    print("TECHNOPARK_WEB_SYNC", {
        "chunks": len(chunks), "attrs_baked": made, "objects_exported": n,
        "glb": glb_path, "glb_mb": round(os.path.getsize(glb_path) / 1048576, 2),
        "glb_replaced_live": replaced, "ifc_entries": total,
        "transform_written": transform is not None,
        "ifc_map": MAP_OUT, "elapsed_sec": round(time.time() - t0, 1),
    })
    if not replaced:
        print("WARNING: technopark.glb is locked (web server running). New file written to:",
              glb_path, "- stop the server or copy it over the live one.")


if __name__ == "__main__" or True:
    main()
