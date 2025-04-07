// server/src/services/exporters/objExporter.js
class OBJExporter {
    static generateOBJ(voxels) {
      let vertices = [];
      let faces = [];
      let vertexIndex = 1; // OBJ indices start from 1
  
      // Process each voxel
      voxels.forEach(voxel => {
        const [x, y, z] = voxel.position;
        const [width, depth, height] = voxel.size;
  
        // Define the 8 vertices of a cube
        const v1 = [x, y, z];
        const v2 = [x + width, y, z];
        const v3 = [x + width, y + depth, z];
        const v4 = [x, y + depth, z];
        const v5 = [x, y, z + height];
        const v6 = [x + width, y, z + height];
        const v7 = [x + width, y + depth, z + height];
        const v8 = [x, y + depth, z + height];
  
        // Add vertices
        vertices.push(v1, v2, v3, v4, v5, v6, v7, v8);
  
        // Define the 6 faces of a cube (2 triangles per face)
        // Bottom face
        faces.push([vertexIndex, vertexIndex + 1, vertexIndex + 2]);
        faces.push([vertexIndex, vertexIndex + 2, vertexIndex + 3]);
        
        // Top face
        faces.push([vertexIndex + 4, vertexIndex + 5, vertexIndex + 6]);
        faces.push([vertexIndex + 4, vertexIndex + 6, vertexIndex + 7]);
        
        // Front face
        faces.push([vertexIndex, vertexIndex + 1, vertexIndex + 5]);
        faces.push([vertexIndex, vertexIndex + 5, vertexIndex + 4]);
        
        // Back face
        faces.push([vertexIndex + 2, vertexIndex + 3, vertexIndex + 7]);
        faces.push([vertexIndex + 2, vertexIndex + 7, vertexIndex + 6]);
        
        // Left face
        faces.push([vertexIndex, vertexIndex + 3, vertexIndex + 7]);
        faces.push([vertexIndex, vertexIndex + 7, vertexIndex + 4]);
        
        // Right face
        faces.push([vertexIndex + 1, vertexIndex + 2, vertexIndex + 6]);
        faces.push([vertexIndex + 1, vertexIndex + 6, vertexIndex + 5]);
  
        vertexIndex += 8;
      });
  
      // Generate OBJ file content
      let objContent = '# Generated by Pixel Art to 3D Converter\n\n';
      
      // Add vertices
      vertices.forEach(v => {
        objContent += `v ${v[0]} ${v[1]} ${v[2]}\n`;
      });
      
      objContent += '\n';
      
      // Add faces
      faces.forEach(f => {
        objContent += `f ${f[0]} ${f[1]} ${f[2]}\n`;
      });
      
      return objContent;
    }
  }
  
  module.exports = OBJExporter;