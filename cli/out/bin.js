#!/usr/bin/env node
import chalk from 'chalk';
import yArgs from 'yargs';
import { execSync } from 'child_process';
import * as fs from 'fs';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import * as path from 'path';
import * as glob from 'glob';

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

var __dirname$2 = process.cwd();
function tryIt(fn) {
    try {
        if (fn instanceof Function) {
            var val = fn();
            if (val !== undefined && val !== null) {
                return val;
            }
        }
        return true;
    }
    catch (e) {
        return false;
    }
}
// make the core directory in the root folder
var lookForCore = function () {
    return tryIt(function () {
        return !fs.existsSync("".concat(__dirname$2, "/core")) && fs.mkdirSync("".concat(__dirname$2, "/core"));
    });
};
// fetch the most recent version of the packages given the tag using the cli command `npm view @plexusjs/core version`
var fetchLatestVersion = function (tag) {
    return execSync("npm view @plexusjs/core@".concat(tag, " version"), {
        encoding: 'utf8',
    }).trim();
};

var TEMPLATES = {
    basic: {
        $schema: {
            js: [
                {
                    name: 'states',
                    ext: 'js',
                    type: 'file',
                    content: 'import { state, collection, computed } from "@plexusjs/core"\n// Importing the ChannelData type\n\n// Create a state instance\nexport const userData = state({\n\tname: "",\n\tage: -1,\n})\n\n// This collection is used to store the channels, the objects should be of type ChannelData defined above\nexport const channelsCollection = collection({\n\tprimaryKey: "uuid", // default value is "id"\n})',
                },
                {
                    name: 'index',
                    ext: 'js',
                    type: 'file',
                    content: '// Import your module instances\nimport * as actions from "./actions"\nimport * as states from "./states"\nimport * as api from "./api"\n\n// Export your module instances from a single index.js file\nexport { actions, states, api }',
                },
                {
                    name: 'api',
                    ext: 'js',
                    type: 'file',
                    content: 'import { api } from "@plexusjs/core"\n\n// You can use the api to make requests to the server at a specific endpoint\nexport const channelBroker = api("https://api.example.com/channels").auth("MyCoolAuthToken", "bearer")',
                },
                {
                    name: 'actions',
                    ext: 'js',
                    type: 'file',
                    content: 'import { actions } from "@plexusjs/core"\n\n// Import your module instances\nimport { channelsCollection } from "./states"\nimport { channelBroker } from "./api"\n\n// This action is used to fetch the channels from the API\nexport const subscribeToChannel = actions(async ({ onCatch }) => {\n\tonCatch(console.error)\n\tconst { data } = await channelBroker.get("/get-channels")\n\n\tchannelsCollection.collect(data)\n})',
                },
            ],
            ts: [
                {
                    name: 'states',
                    ext: 'ts',
                    type: 'file',
                    content: 'import { state, collection, computed } from "@plexusjs/core"\n// Importing the ChannelData type\nimport { ChannelData } from "./types"\n\n// Create a state instance\nexport const userData = state({\n\tname: "",\n\tage: -1,\n})\n\n// This collection is used to store the channels, the objects should be of type ChannelData defined above\nexport const channelsCollection = collection<ChannelData>({\n\tprimaryKey: "uuid", // default value is "id"\n})',
                },
                {
                    name: 'index',
                    ext: 'ts',
                    type: 'file',
                    content: '// Import your module instances\nimport * as actions from "./actions"\nimport * as states from "./states"\nimport * as api from "./api"\n\n// Export your module instances from a single index.ts file\nexport { actions, states, api }',
                },
                {
                    name: 'actions',
                    ext: 'ts',
                    type: 'file',
                    content: 'import { actions } from "@plexusjs/core"\n\n// Import your module instances\nimport { channelsCollection } from "./states"\nimport { channelBroker } from "./api"\n\n// This action is used to fetch the channels from the API\nexport const subscribeToChannel = actions(async ({ onCatch }) => {\n\tonCatch(console.error)\n\tconst { data } = await channelBroker.get("/get-channels")\n\n\tchannelsCollection.collect(data)\n})',
                },
                {
                    name: 'api',
                    ext: 'ts',
                    type: 'file',
                    content: 'import { api } from "@plexusjs/core"\n\n// You can use the api to make requests to the server at a specific endpoint\nexport const channelBroker = api("https://api.example.com/channels").auth("MyCoolAuthToken", "bearer")',
                },
                {
                    name: 'types',
                    ext: 'ts',
                    type: 'file',
                    content: 'export interface ChannelData {\n\tuuid: string\n\tname: string\n\tfollowers: number\n}',
                },
            ],
        },
    },
    scalable: {
        $schema: {
            js: [
                {
                    name: 'modules',
                    type: 'dir',
                    content: [
                        {
                            name: 'user',
                            type: 'dir',
                            content: [
                                {
                                    name: 'states',
                                    ext: 'js',
                                    type: 'file',
                                    content: 'import { state, collection, computed } from "@plexusjs/core"\n\n// Create a state instance\nexport const userData = state({\n\tfirst_name: "",\n\tlast_name: "",\n\temail: "",\n\tuuid: "",\n\tstatus: "offline",\n})\n\n// This collection is used to store the channels, the objects should be of type ChannelData defined above\nexport const friends = collection({\n\tprimaryKey: "uuid", // default value is "id"\n})\n\t.createGroups(["online", "offline"])\n\t.createSelector("messaging")',
                                },
                                {
                                    name: 'index',
                                    ext: 'js',
                                    type: 'file',
                                    content: '// Import your module instances\nimport * as actions from "./actions"\nimport * as states from "./states"\nimport * as api from "./api"\n\n// Export your instances as a module\nexport const user = { actions, states, api }\n\nexport default user',
                                },
                                {
                                    name: 'api',
                                    ext: 'js',
                                    type: 'file',
                                    content: 'import { api } from "@plexusjs/core"\n\n// You can use the api to make requests to the server at a specific endpoint\nexport const userBroker = api("https://api.example.com/users").auth("MySeCrEtToKeN", "bearer")',
                                },
                                {
                                    name: 'actions',
                                    ext: 'js',
                                    type: 'file',
                                    content: 'import { action } from "@plexusjs/core"\n\n// Import your module\'s resources\nimport { friends, userData } from "./states"\nimport { userBroker } from "./api"\n\n// This action is used to message a friend. It takes in a user id and an optional message. We can take that and proccess\nexport const startMessageSession = action(async ({ onCatch }, uuid, message="") => {\n\t// If any part of this action throws an error, it will be caught here\n\tonCatch(console.error)\n\n\t// Retrieve the full friend object from the collection\n\tconst friendToMessage = friends.getItemValue(uuid)\n\t\n\t// Call the api with a post request to send the message; the second param sent as a request body\n\tconst { data } = await userBroker.post("/message/send", {\n\t\tto: friendToMessage.uuid,\n\t\tmessage,\n\t})\n\treturn data\n})\n\n// this action is used to populate the friends collection\nexport const getFriends = action(async ({ onCatch }) => {\n\t// If any part of this action throws an error, it will be caught here\n\tonCatch(console.error)\n\t// Call the api with a post request to send the message; the second param sent as a url query\n\tconst { data, status } = await userBroker.get("/friends/of", {\n\t\tuuid: userData.value.uuid, // The uuid of the current user\n\t})\n\n\t// if the request was successful, we can add the friends to the collection\n\tif (status === 200) {\n\t\tfriends.collect(data.friends)\n\t}\n\t// if the request was not successful, we can handle the error\n\telse if (status > 200) {\n\t\tconsole.error(data)\n\t}\n})',
                                },
                            ],
                        },
                    ],
                },
                {
                    name: 'index',
                    type: 'file',
                    ext: 'js',
                    content: '// Import your module instances\nimport { user } from "./modules/user"\n\n// Export your modules from a single index.ts file\nconst core = { user }\n\nexport default core',
                },
            ],
            ts: [
                {
                    name: 'modules',
                    type: 'dir',
                    content: [
                        {
                            name: 'user',
                            type: 'dir',
                            content: [
                                {
                                    name: 'states',
                                    ext: 'ts',
                                    type: 'file',
                                    content: 'import { state, collection, computed } from "@plexusjs/core"\nimport { UserData } from "./types"\n\n// Create a state instance\nexport const userData = state<UserData>({\n\tfirst_name: "",\n\tlast_name: "",\n\temail: "",\n\tuuid: "",\n\tstatus: "offline",\n})\n\n// This collection is used to store the channels, the objects should be of type ChannelData defined above\nexport const friends = collection<UserData>({\n\tprimaryKey: "uuid", // default value is "id"\n})\n\t.createGroups(["online", "offline"])\n\t.createSelector("messaging")',
                                },
                                {
                                    name: 'index',
                                    ext: 'ts',
                                    type: 'file',
                                    content: '// Import your module instances\nimport * as actions from "./actions"\nimport * as states from "./states"\nimport * as api from "./api"\n\n// Export your instances as a module\nexport const user = { actions, states, api }\n\nexport default user',
                                },
                                {
                                    name: 'actions',
                                    ext: 'ts',
                                    type: 'file',
                                    content: 'import { action } from "@plexusjs/core"\n\n// Import your module\'s resources\nimport { friends, userData } from "./states"\nimport { userBroker } from "./api"\n\nimport { RetrieveFriendsRes, SendMessageRes } from "./types"\n\n// This action is used to message a friend. It takes in a user id and an optional message. We can take that and proccess\nexport const startMessageSession = action(async ({ onCatch }, uuid: string, message?: string) => {\n\t// If any part of this action throws an error, it will be caught here\n\tonCatch(console.error)\n\n\t// Retrieve the full friend object from the collection\n\tconst friendToMessage = friends.getItemValue(uuid)\n\t\n\t// Call the api with a post request to send the message; the second param sent as a request body\n\tconst { data } = await userBroker.post<SendMessageRes>("/message/send", {\n\t\tto: friendToMessage.uuid,\n\t\tmessage,\n\t})\n\treturn data\n})\n\n// this action is used to populate the friends collection\nexport const getFriends = action(async ({ onCatch }) => {\n\t// If any part of this action throws an error, it will be caught here\n\tonCatch(console.error)\n\t// Call the api with a post request to send the message; the second param sent as a url query\n\tconst { data, status } = await userBroker.get<RetrieveFriendsRes>("/friends/of", {\n\t\tuuid: userData.value.uuid, // The uuid of the current user\n\t})\n\n\t// if the request was successful, we can add the friends to the collection\n\tif (status === 200) {\n\t\tfriends.collect(data.friends)\n\t}\n\t// if the request was not successful, we can handle the error\n\telse if (status > 200) {\n\t\tconsole.error(data)\n\t}\n})',
                                },
                                {
                                    name: 'api',
                                    ext: 'ts',
                                    type: 'file',
                                    content: 'import { api } from "@plexusjs/core"\n\n// You can use the api to make requests to the server at a specific endpoint\nexport const userBroker = api("https://api.example.com/users").auth("MySeCrEtToKeN", "bearer")',
                                },
                                {
                                    name: 'types',
                                    ext: 'ts',
                                    type: 'file',
                                    content: 'export interface UserData {\n\tuuid: string\n\tfirst_name: string\n\tlast_name: string\n\temail: string\n\tstatus: "online" | "offline"\n}\nexport type SendMessageRes = {\n\tsuccess: boolean\n\tmessage: string\n\tts: number\n}\n\nexport type RetrieveFriendsRes = {\n\tfriends: UserData[]\n}',
                                },
                            ],
                        },
                    ],
                },
                {
                    name: 'index',
                    type: 'file',
                    ext: 'ts',
                    content: '// Import your module instances\nimport { user } from "./modules/user"\n\n// Export your modules from a single index.ts file\nconst core = { user }\n\nexport default core',
                },
            ],
        },
    },
};

var yargs$2 = yArgs(process.argv);
var __dirname$1 = process.cwd();
var genFileOrDir = function (arr, path) {
    if (path === void 0) { path = '/core'; }
    if (!Array.isArray(arr)) {
        return false;
    }
    if (typeof path !== 'string') {
        return false;
    }
    var _loop_1 = function (obj) {
        var fileName = "".concat(obj.name, ".").concat(obj.ext || 'js');
        var filePath = "".concat(path, "/").concat(fileName);
        // if we are creating a file
        if (obj.type === 'file') {
            process.stdout.write("Creating ".concat(chalk.cyan("\"".concat(path, "/").concat(fileName, "\"")), "... ::"));
            tryIt(function () { return writeFileSync("".concat(__dirname$1).concat(filePath), obj.content); })
                ? process.stdout.write(chalk.green("Success!\n"))
                : process.stdout.write(chalk.yellow("Failure!\n"));
        }
        // if we are creating a directory
        else if (obj.type === 'dir') {
            process.stdout.write("Creating ".concat(chalk.cyan("\"".concat(path, "/").concat(obj.name, "/\"")), "... ::"));
            tryIt(function () { return mkdirSync("".concat(__dirname$1).concat(path, "/").concat(obj.name)); })
                ? process.stdout.write(chalk.green("Success\n"))
                : process.stdout.write(chalk.yellow("Failed\n"));
            // recurse into the directory
            genFileOrDir(obj.content, "".concat(path, "/").concat(obj.name));
        }
    };
    for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
        var obj = arr_1[_i];
        _loop_1(obj);
    }
    return true;
};
var genFiles = function (template) {
    var _a, _b;
    if (template === void 0) { template = 'basic'; }
    // check if the template string is one of the available templates
    if (!__spreadArray([], Object.keys(TEMPLATES), true).includes(template)) {
        console.error("Template ".concat(template, " not found."));
        return false;
    }
    // make the core directory in the root folder
    lookForCore();
    // copy the core files to the core directory
    // const structRaw = fs.readFileSync(`./data/${template}.json`, { encoding: 'utf8' })
    // const struct = JSON.parse(structRaw)
    var struct = TEMPLATES[template];
    if (yargs$2.argv.typescript || yargs$2.argv.ts) {
        console.log(chalk.bgWhite.black('Creating TS Files...'));
        genFileOrDir((_a = struct === null || struct === void 0 ? void 0 : struct.$schema) === null || _a === void 0 ? void 0 : _a.ts);
    }
    else {
        console.log(chalk.bgWhite.black('Creating JS Files...'));
        genFileOrDir((_b = struct === null || struct === void 0 ? void 0 : struct.$schema) === null || _b === void 0 ? void 0 : _b.js);
    }
};

var yargs$1 = yArgs(process.argv);
var __dirname = process.cwd();
// a function that iterates through the execution directory, finds all of the `package.json` files, and returns their full paths
function findPackageJsons() {
    return glob.sync(path.join(process.cwd(), '**/package.json'), {
        ignore: ['**/node_modules/**', '**/dist/**'],
    });
}
// a function that finds all of the `package.json` files, and updates their `dependencies` and `devDependencies` all plexusjs packages to the specified version
function updatePackageJsons(tag) {
    if (tag === void 0) { tag = ''; }
    var packageJsons = findPackageJsons();
    for (var _i = 0, packageJsons_1 = packageJsons; _i < packageJsons_1.length; _i++) {
        var packageJson = packageJsons_1[_i];
        // read & parse the package.json file
        var packageJsonData = JSON.parse(readFileSync(packageJson, { encoding: 'utf8' }));
        // extract the `dependencies` and `devDependencies` fields
        var dependencies = packageJsonData.dependencies, devDependencies = packageJsonData.devDependencies;
        // if the package.json file doesn't have a `dependencies` or `devDependencies` field, skip it
        if (!dependencies && !devDependencies) {
            continue;
        }
        var foundSome = false;
        if (dependencies) {
            for (var dependency in dependencies) {
                if (dependency.startsWith('@plexusjs')) {
                    dependencies[dependency] = tag;
                    foundSome = true;
                }
            }
            packageJsonData.dependencies = dependencies;
        }
        if (devDependencies) {
            for (var dependency in devDependencies) {
                if (dependency.startsWith('@plexusjs')) {
                    devDependencies[dependency] = tag;
                    foundSome = true;
                }
            }
            packageJsonData.devDependencies = devDependencies;
        }
        if (foundSome) {
            writeFileSync(packageJson, JSON.stringify(packageJsonData, null, 2));
        }
    }
}
var installPlexus = function (tag) {
    if (tag === void 0) { tag = ''; }
    if (yargs$1.argv['skip-install']) {
        console.log('Skipping Install...');
        return;
    }
    // initialize the prefix with npm install syntax
    var installCommand = 'npm install --save';
    // if we have a yarn.lock file or the yarn flag, use yarn to install
    if (existsSync("".concat(__dirname, "/yarn.lock")) || yargs$1.argv.yarn) {
        console.log(chalk.cyan.bgWhite("Using Yarn Package Manager"));
        installCommand = 'yarn install';
    }
    else {
        console.log(chalk.cyan.bgWhite('Using NPM Package Manager'));
    }
    // install the packages
    var tagFinal = tag && ['canary', 'latest'].includes(tag)
        ? tag
        : 'latest';
    var version = fetchLatestVersion(tagFinal);
    updatePackageJsons(version);
    tryIt(function () { return execSync("".concat(installCommand), { stdio: 'inherit' }); })
        ? console.log(chalk.bgGreen.black("Plexus".concat(tag ? "(".concat(tag, ")") : "", " installed successfully!")))
        : console.error(chalk.bgRed.black('Failed to install Plexus Packages. 😞'));
};

// import { genFileOrDir } from './fsManagement'
var yargs = yArgs(process.argv);
process.cwd();
var helpString = "\n\tUsage:\n\t\t$ npx plexus-cli <command> <options>\n\n\tCommands:\n\t\t\n\t\tmodule <name>\t\t\tCreate a new module in your plexus core\n\t\tupdate <version>\t\tUpdate your plexus install\n\n\tOptions:\n\t\t--yarn\t\t\t\t\tUse Yarn as the package manager\n\t\t--canary\t\t\t\tUse the canary version of plexus\n\t\t--dev\t\t\t\t\tUse the dev version of plexus\n\t    --skip-install\t\t\tSkip the install of the PlexusJS packages\n\t\t--typescript\t\t\tCreate TypeScript files\n\t\t--react\t\t\t\t\tInstall the React package\n\t\t--next\t\t\t\t\tInstall the Next package\n\t\t--template=<template>\tChoose the template to use to generate a PlexusJS core\n\n";
function run() {
    var commandRan = false;
    if (yargs.argv._[2] === 'module') {
        if (yargs.argv._[1]) ;
        return;
    }
    if (yargs.argv._[2] === 'update') {
        if (yargs.argv.canary) {
            console.log(chalk.bgWhite.black('Updating PlexusJS to latest Canary build...'));
            installPlexus('canary');
        }
        else if (yargs.argv.latest) {
            console.log(chalk.bgWhite.black('Updating PlexusJS to Latest stable build...'));
            installPlexus('latest');
        }
        else {
            installPlexus();
        }
        commandRan = true;
        return;
    }
    // parse the command line arguments
    if (yargs.argv.template) {
        // try installing the packages
        installPlexus();
        // generate the core files
        if (typeof yargs.argv.template === 'string' ||
            yargs.argv.template === undefined) {
            try {
                switch (yargs.argv.template) {
                    case 'scalable': {
                        console.log('Using Scalable Template...');
                        genFiles('scalable');
                        break;
                    }
                    default: {
                        console.log('Using Basic Template...');
                        genFiles();
                        break;
                    }
                }
            }
            catch (e) {
                console.warn(e);
            }
        }
        else {
            console.warn('Invalid Template');
        }
        commandRan = true;
        return;
    }
    if (!commandRan) {
        console.log(helpString);
        return;
    }
}
run();
