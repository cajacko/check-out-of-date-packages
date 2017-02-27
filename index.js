const npmCheck = require('npm-check');
const winston = require('winston');
const inquirer = require('inquirer');
const fs = require('fs');

function isAuthor(npmPackage, checkAuthor) {
  if (!checkAuthor) {
    return false;
  }

  if (!npmPackage) {
    return false;
  }

  if (!npmPackage.author) {
    return false;
  }

  if (npmPackage.author === checkAuthor) {
    return true;
  }

  if (typeof npmPackage.author === 'string' && npmPackage.author.includes(checkAuthor)) {
    return true;
  }

  if (!npmPackage.author.name) {
    return false;
  }

  if (checkAuthor === npmPackage.author.name) {
    return true;
  }

  return false;
}

module.exports = function checkPackages(cwd, author) {
  const packageJsonPath = `${cwd}package.json`;
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  return npmCheck({ cwd }).then((currentState) => {
    const npmPackages = currentState.get('packages');
    let needUpdating = false;

    npmPackages.forEach((npmPackage) => {
      const npmPackageConfigPath = `${cwd}node_modules/${npmPackage.moduleName}/package.json`;
      const npmPackageConfig = JSON.parse(fs.readFileSync(npmPackageConfigPath, 'utf8'));

      if (author && !isAuthor(npmPackageConfig, author)) {
        return true;
      }

      if (npmPackage.latest !== npmPackage.installed) {
        needUpdating = true;
        winston.log('info', `${packageJson.name} Package out of date: ${npmPackage.moduleName} ${npmPackage.installed} -> ${npmPackage.latest}`);
        return false;
      }

      return true;
    });

    if (needUpdating) {
      return inquirer.prompt([{
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
};
