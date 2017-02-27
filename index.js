const npmCheck = require('npm-check');
const winston = require('winston');

module.exports = function(cwd) {
  return npmCheck({ cwd }).then((currentState) => {
    const npmPackages = currentState.get('packages');
    let needUpdating = false;

    npmPackages.forEach((npmPackage) => {
      if (npmPackage.latest !== npmPackage.installed) {
        needUpdating = true;
        winston.log('info', `${npmName} Package out of date: ${npmPackage.moduleName} ${npmPackage.installed} -> ${npmPackage.latest}`);
      }
    });

    if (needUpdating) {
      return this.prompt([{
        type: 'confirm',
        name: 'continue',
        message: 'This generator has packages which are out of date, do you want to continue?',
        default: false
      }]).then((answers) => {
        if (answers.continue) {
          return true;
        }

        throw new Error('Packages are out of date, please update and commit them before continuing.');
      });
    }

    return true;
  });
}
