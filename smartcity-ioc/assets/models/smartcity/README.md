# Smart City static GLB assets

The browser scene loads these static assets with `GLTFLoader`:

- `terrain.glb`: ground, park, lake, and grass patches
- `roads.glb`: roads, lane markings, crosswalks, arrows, and roundabout
- `buildings.glb`: buildings, roofs, facade materials, and accents
- `landscape.glb`: trees, benches, and parking area

Vehicles, traffic lights, cameras, sensors, interaction, and animation remain in Three.js.

The editable source of truth is now:

`smartcity-ioc/assets/blender/smartcity-master.blend`

After editing and saving the Blender file, export the web assets with:

```powershell
npm.cmd run blender:smartcity:export
```

The procedural generator remains available only to rebuild the initial Blender source
from JavaScript scene data:

```powershell
npm.cmd run generate:smartcity
npm.cmd run blender:smartcity:create
```

All GLB files use the same origin, scale, and coordinates. Import the four files into
Blender without changing their transforms to reconstruct the complete static scene.
