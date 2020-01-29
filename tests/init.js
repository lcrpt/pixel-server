require('dotenv').config({ path: '.env.test' });

const chai = require('chai');

// prevent parse errors not displayed by mocha
process.on('uncaughtException', (err) => {
    console.log(err.stack);
    process.exit(1);
});

chai.use(require('chai-subset'));
chai.use(require('chai-as-promised'));
chai.use(require('chai-spies'));
