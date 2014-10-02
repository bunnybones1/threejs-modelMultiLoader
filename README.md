## Getting Started

### What is ThreejsModelMultiLoader?

This is an example-driven module for threejs modules and projects.

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
