require("dotenv").config();
const shell = require("shelljs");
const builder = require("electron-builder");

(async () => {
    const inquirer = await import("inquirer");
    
    const { bump } = await inquirer.default.prompt([
        {
            type: "list",
            name: "bump",
            message: "¿What type of version do you want to apply?",
            choices: ["patch", "minor", "major"],
        },
    ]);

    const ghToken = process.env.GH_TOKEN;

    if (!ghToken) {
        console.error("❌ GH_TOKEN is not defined in the environment or in the .env file");
        process.exit(1);
    }

    // Paso 1: Bump de versión con git tag
    if (shell.exec(`npm version ${bump}`).code !== 0) {
        console.error("❌ Failed versioning");
        process.exit(1);
    }

    // Paso 2: Hacer push del tag a GitHub
    if (
        shell.exec(`git push`).code !== 0 ||
        shell.exec(`git push --tags`).code !== 0
    ) {
        console.error("❌ Failed to push to GitHub");
        process.exit(1);
    }

    // Paso 3: Build y release
    console.log("🚀 Starting build and release...");
    process.env.GH_TOKEN = ghToken;

    builder
        .build({
            publish: "always",
        })
        .then(() => {
            console.log("✅ Build and release completed successfully.");
        })
        .catch((error) => {
            console.error("❌ Error during build/release:", error);
            process.exit(1);
        });
})();
