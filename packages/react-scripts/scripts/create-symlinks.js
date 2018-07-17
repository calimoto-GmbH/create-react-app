const fs = require("fs");
const path = require("path");
const camelcase = require("camelcase");

/**
 * This file checks if the symlinks for a module exists and if not creates it. 😎
 * It's needed for developing on other react compononet which are required for this app.
 * So, do "npm run start" on this app and develop on another.
 * 
 * That means that the git repo of the other components must cloned next to this repo.
*/

const cwd = process.cwd();

// Which modules get a symlink.
const thisPackageJson = JSON.parse(fs.readFileSync(path.join(cwd + "/package.json")));
const modules = thisPackageJson.symlinkingModules;


// Where the symlinks will be saved.
const symlinkPath = path.join(cwd + "/src/symlinks/");
if(!fs.existsSync(symlinkPath)){
    fs.mkdirSync(symlinkPath);
}
//Read the already existing symlinks.
const existingSymlinks = fs.readdirSync(symlinkPath);
// The get module file as string.
let getModuleFile = "";

modules.forEach(moduleName => {

    //Create the symlinks only in development mode.
    if (process.env.NODE_ENV === "development") {

        // Create the target url for the symlink.
        const targetUrl = symlinkPath + moduleName + ".symlink";
        // Check if symlink exists.
        if (existingSymlinks.indexOf(path.parse(targetUrl).base) === -1) {

            //Get the package.json to find out which is the entry point (if given).
            const modulePackageJson = JSON.parse(fs.readFileSync(path.join(cwd + "/../" + moduleName + "/package.json")));
            const main = modulePackageJson.main || "index.js";

            // Create symlink.
            fs.symlinkSync(path.join(cwd + "/../" + moduleName + "/" + main), targetUrl);
        }
    }

    //Build the get-file on development and production mode.

    // Use a camelcased module name.
    const camelcasedModuleName = camelcase(moduleName);
    //Append the string from the module file with js code.
    getModuleFile += `
        let ${camelcasedModuleName};
            if(process.env.NODE_ENV === "development"){
                ${camelcasedModuleName} = require("symlinks/${moduleName}.symlink").default;
            }else{
            ${camelcasedModuleName} = require("${moduleName}").default;
        }
        export {${camelcasedModuleName}};
    `;
});

//Write the get-module file.
fs.writeFileSync(symlinkPath + "get-modules.js", getModuleFile);