import { Octokit } from "@octokit/core";
import {restEndpointMethods} from '@octokit/plugin-rest-endpoint-methods';
import { join } from 'path';
import { readFile } from 'fs/promises';

const token = process.env.GITHUB_TOKEN;

const tauri_update_file = (name,sig,url) => ({
    name: name,
    pub_date: new Date().toISOString(),
    platforms: {
      win64: {
        signature: sig,
        url
      }
    }
});

/**
 * @return {Promise<string>} 
 */
const read_package_version = async () => {
  const file = await readFile("package.json",{encoding:"utf-8"});
  const data = JSON.parse(file);
  return data.version;
}

const read_signature = async (id) => {
  const file = `Rusty Minecraft Launcher_${id}_x64_en-US.msi.zip.sig`;
  const path = join("src-tauri/target/release/bundle/msi/",file);
 
  const content = await readFile(path,{ encoding: "utf-8"});

  return content;
}

async function main(){
    const owner = { owner: "VisualSource", repo: "rusty-mc-launcher" };
    console.log("Setting up github");

    const plugin = Octokit.plugin(restEndpointMethods);
    const github = new plugin({ auth: token });
    console.log("Read Package Json");
    const update_id = await read_package_version();
    console.log(`== Update v${update_id} ==`);
    console.log("Getting latest release");
    const releases = await github.request("GET /repos/{owner}/{repo}/releases/latest", owner);
    
    const asset = releases.data.assets.find(asset=>asset.name.endsWith(".zip"));

    console.log("Reading signaure");
    const signature = await read_signature(update_id);

    console.log("Generation File");
    const file = tauri_update_file(`v${update_id}`,signature,asset.browser_download_url);
    console.log(JSON.stringify(file,undefined,2));

    console.log("Getting update tag")
    const update_tag = await github.request("GET /repos/{owner}/{repo}/releases/tags/{tag}",{
      ...owner,
      tag: "Updater"
    });

    const RELASE = update_tag.data;

    const FILE_ID = RELASE.assets?.at(0);
    if(FILE_ID) {
      console.log("Removing file");
      await github.rest.repos.deleteReleaseAsset({...owner, asset_id: FILE_ID.id });
    }
    console.log("Uploading new file");
    await github.rest.repos.uploadReleaseAsset({ ...owner, release_id: RELASE.id, name: "latest_version.json", data: JSON.stringify(file) });
  }
   

main();







