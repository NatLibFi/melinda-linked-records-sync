import fs from 'fs';
import path from 'path';

run();

function run() {
    try {
        const filepath = path.resolve('./job/done.txt');
        if (fs.existsSync(filepath)) {
            fs.unlink(filepath, function (err) {
                if (err) throw err;
                console.log('History deleted!');
            });
        }
    } catch (err) {}
}