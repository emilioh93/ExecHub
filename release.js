require("dotenv").config();
const shell = require("shelljs");
const builder = require("electron-builder");

// Function to publish draft release
async function publishDraftRelease(version, token) {
    const https = require('https');
    
    // Get the draft release
    const options = {
        hostname: 'api.github.com',
        path: '/repos/emilioh93/ExecHub/releases',
        method: 'GET',
        headers: {
            'Authorization': `token ${token}`,
            'User-Agent': 'ExecHub-Release-Script'
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const releases = JSON.parse(data);
                    const draftRelease = releases.find(r => r.tag_name === `v${version}` && r.draft);
                    
                    if (draftRelease) {
                        // Publish the draft
                        const publishOptions = {
                            hostname: 'api.github.com',
                            path: `/repos/emilioh93/ExecHub/releases/${draftRelease.id}`,
                            method: 'PATCH',
                            headers: {
                                'Authorization': `token ${token}`,
                                'User-Agent': 'ExecHub-Release-Script',
                                'Content-Type': 'application/json'
                            }
                        };
                        
                        const publishReq = https.request(publishOptions, (publishRes) => {
                            let publishData = '';
                            publishRes.on('data', (chunk) => publishData += chunk);
                            publishRes.on('end', () => {
                                console.log("✅ Release published successfully (no longer draft)");
                                resolve();
                            });
                        });
                        
                        publishReq.on('error', reject);
                        publishReq.write(JSON.stringify({ draft: false }));
                        publishReq.end();
                    } else {
                        console.log("ℹ️  No draft release found to publish");
                        resolve();
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        req.on('error', reject);
        req.end();
    });
}

(async () => {
    // Dynamic import of inquirer for v12+
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

    // Step 1: Bump of version with git tag
    if (shell.exec(`npm version ${bump}`).code !== 0) {
        console.error("❌ Failed versioning");
        process.exit(1);
    }

    // Get the new version
    const packageJson = require('./package.json');
    const newVersion = packageJson.version;

    // Step 2: Push the tag to GitHub
    if (
        shell.exec(`git push`).code !== 0 ||
        shell.exec(`git push --tags`).code !== 0
    ) {
        console.error("❌ Failed to push to GitHub");
        process.exit(1);
    }

    // Step 3: Build and release
    console.log("🚀 Starting build and release...");
    process.env.GH_TOKEN = ghToken;

    try {
        await builder.build({
            publish: "always"
        });
        
        console.log("✅ Build and release completed successfully.");
        
        // Step 4: Publish the draft release
        console.log("🔄 Publishing draft release...");
        await publishDraftRelease(newVersion, ghToken);
        
    } catch (error) {
        console.error("❌ Error during build/release:", error);
        process.exit(1);
    }
})();
