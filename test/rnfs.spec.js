"use strict";

const expect = require('expect.js');

module.exports = function (describe, beforeEach, it, RNFS) {
  const root = `${RNFS.DocumentDirectoryPath}/workingdir`;

  describe('filesystem', function () {
    beforeEach(function () {
      // Blow away the working directory before each test and recreate it empty
      return RNFS.unlink(root).catch(() => { /* ignore */ }).then(() => {
        return RNFS.mkdir(root);
      });
    });

    it('can empty read dir', function () {
      return RNFS.readdir(root).then(files => {
        expect(files.length).to.be(0);
      });
    });

    it('can write and read utf8', function () {
      const textFilePath = `${root}/file.txt`;

      return Promise.resolve().then(() => {
        return RNFS.writeFile(textFilePath, 'foo © bar 𝌆 baz', 'utf8').then(res => {
          expect(res).to.be(undefined);
        });
      }).then(() => {
        return RNFS.readdir(root).then(files => {
          expect(files.length).to.be(1);
          expect(files[0]).to.be('file.txt');
        });
      }).then(() => {
        return RNFS.readFile(textFilePath, 'utf8').then(contents => {
          expect(contents).to.be('foo © bar 𝌆 baz');
        });
      });
    });

    it('can create nested directores, write a file, then remove recursively', function () {
      const firstDirPath = `${root}/a`;
      const nestedDirPath = `${firstDirPath}/b/c`;
      const fileInDirPath = `${nestedDirPath}/file.txt`;

      return Promise.resolve().then(() => {
        return RNFS.mkdir(nestedDirPath).then(res => {
          expect(res).to.be(undefined);
        });
      }).then(() => {
        return RNFS.exists(nestedDirPath).then(res => {
          expect(res).to.be(true);
        });
      }).then(() => {
        return RNFS.writeFile(fileInDirPath, 'Some contents', 'utf8').then(res => {
          expect(res).to.be(undefined);
        });
      }).then(() => {
        return RNFS.exists(fileInDirPath).then(res => {
          expect(res).to.be(true);
        });
      }).then(() => {
        return RNFS.unlink(firstDirPath).then(res => {
          expect(res).to.be(undefined);
        });
      }).then(() => {
        return RNFS.exists(firstDirPath).then(res => {
          expect(res).to.be(false);
        });
      })
    });

    it('can append to files', function () {
      var f1 = `${root}/f1.txt`;
      var f2 = `${root}/f2.txt`;

      return Promise.resolve().then(() => {
        return RNFS.writeFile(f1, 'foo © bar 𝌆 baz', 'utf8');
      }).then(() => {
        return RNFS.appendFile(f1, 'baz 𝌆 bar © foo', 'utf8');
      }).then(() => {
        return RNFS.appendFile(f2, 'baz 𝌆 bar © foo', 'utf8');
      }).then(() => {
        return RNFS.readFile(f1, 'utf8').then(contents => {
          expect(contents).to.be('foo © bar 𝌆 bazbaz 𝌆 bar © foo');
        });
      }).then(() => {
        return RNFS.readFile(f2, 'utf8').then(contents => {
          expect(contents).to.be('baz 𝌆 bar © foo');
        });
      });
    });

    it('can write/read with options and stat', function () {
      const textFilePath = `${root}/file.txt`;

      return Promise.resolve().then(() => {
        return RNFS.writeFile(textFilePath, 'Some contents', { encoding: 'utf8' }).then(res => {
          expect(res).to.be(undefined);
        });
      }).then(() => {
        return RNFS.readFile(textFilePath, { encoding: 'utf8' }).then(res => {
          expect(res).to.be('Some contents');
        });
      }).then(() => {
        return RNFS.stat(textFilePath).then(stat => {
          expect(stat.size).to.be(13);
          expect(stat.isFile()).to.be(true);
          expect(stat.isDirectory()).to.be(false);
        });
      }).then(() => {
        return RNFS.stat(root).then(stat => {
          expect(stat.isFile()).to.be(false);
          expect(stat.isDirectory()).to.be(true);
        });
      });
    });

    it('can copy a file', function () {
      const origFilePath = `${root}/orig.txt`;
      const copyFilePath = `${root}/copy.txt`;

      return Promise.resolve().then(() => {
        return RNFS.writeFile(origFilePath, 'Some contents', { encoding: 'utf8' }).then(res => {
          expect(res).to.be(undefined);
        });
      }).then(() => {
        return RNFS.copyFile(origFilePath, copyFilePath).then(res => {
          expect(res).to.be(undefined);
        });
      }).then(() => {
        return RNFS.readFile(origFilePath, { encoding: 'utf8' }).then(res => {
          expect(res).to.be('Some contents');
        });
      }).then(() => {
        return RNFS.readFile(copyFilePath, { encoding: 'utf8' }).then(res => {
          expect(res).to.be('Some contents');
        });
      });
    });

    it('can move a file', function () {
      const origFilePath = `${root}/orig.txt`;
      const moveFilePath = `${root}/move.txt`;

      return Promise.resolve().then(() => {
        return RNFS.writeFile(origFilePath, 'Some contents', { encoding: 'utf8' }).then(res => {
          expect(res).to.be(undefined);
        });
      }).then(() => {
        return RNFS.moveFile(origFilePath, moveFilePath).then(res => {
          expect(res).to.be(undefined);
        });
      }).then(() => {
        return RNFS.exists(origFilePath).then(res => {
          expect(res).to.be(false);
        });
      }).then(() => {
        return RNFS.readFile(moveFilePath, { encoding: 'utf8' }).then(res => {
          expect(res).to.be('Some contents');
        });
      });
    });

    it('errors when reading a non-existant file', function () {
      const textFilePath = `${root}/doesnotexist.txt`;

      return RNFS.readFile(textFilePath).then(res => {
        expect().fail('Should not resolve');
      }, err => {
        expect(err.message).to.match(/^ENOENT: no such file or directory, open/);
        expect(err.code).to.be('ENOENT');
      });
    });

    it('errors when reading a directory as a file', function () {
      return RNFS.readFile(root).then(res => {
        expect().fail('Should not resolve');
      }, err => {
        expect(err.message).to.be('EISDIR: illegal operation on a directory, read');
        expect(err.code).to.be('EISDIR');
      });
    });
  });
};