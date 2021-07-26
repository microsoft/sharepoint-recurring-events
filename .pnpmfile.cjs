'use strict';

function readPackage(pkg, context) {
  // Override the manifest of foo@1.x after downloading it from the registry
  if (pkg.name === 'glob-parent' && pkg.version.startsWith('3.')) {
    pkg.dependencies = {
      ...pkg.dependencies,
      "glob-parent": '5.1.2'
    }
    context.log(`glob-parent@^3 => glob-parent@5.1.2 in dependencies of ${pkg.name}`)
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage
  }
}
