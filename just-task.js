const rimraf = require('rimraf');
const { parallel, task } = require('just-task');
const { logger, jestTask, tscTask, eslintTask } = require('just-scripts');

task('tsc', tscTask({}));
task('eslint', eslintTask());
task('test', jestTask());
task('clean', async () => {
    const makeCb = (dirName, res) => (error) => {
        if (error) {
            logger.error(`Error removing ${dirName}`, error);
        }

        logger.info(`Deleted ${dirName}`);
        res();
    };

    const delPromises = [];

    delPromises.push(new Promise(res => rimraf('junit.xml', makeCb('junit.xml', res))));
    delPromises.push(new Promise(res => rimraf('jest', makeCb('jest', res))));
    delPromises.push(new Promise(res => rimraf('lib', makeCb('lib', res))));
    delPromises.push(new Promise(res => rimraf('*.log', makeCb('*.log', res))));
});

task('build', parallel('tsc', 'eslint'));