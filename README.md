## Getting Started

### What is ThreejsModelMultiLoader?

This is a loader for 3D files into threejs.
Supported formats are:
- DAE (Autodesk collada)
- JSON (converted by the official threejs converter)
- JSON TREE (A split up version of the JSON format, optimized for streaming)
- TARGZ (A compressed version of the JSON format, optimized for size)
- TARGZ TREE(A compressed version of the JSON TREE format, optimized for size and streaming)

This module is preset via the [generator-threejs-module](http://github.com/bunnybones1/generator-threejs-module) yeoman generator.
To begin development, simply run:
```bash
grunt
```
and navigate to [this address](localhost:9000/examples/01_Basic/)

### Prescribed development

Develop your core library in ```src/core```
Develop your example code in ```src/examples```
Create very basic html modelled after ```app/examples/01_Basic/index.html```

Everything is stubbed out to generate a core library `ThreejsModelMultiLoader.js`. Examples are secondary to distribution but core to development. Examples behave in a plugin style, so your `ThreejsModelMultiLoader.js` is globally available as `ThreejsModelMultiLoader`, and examples will appear under `ThreejsModelMultiLoader.examples`.
This module is also npm requireable.

Update this README.md as soon as you identify your module's purpose.

## License

MIT
