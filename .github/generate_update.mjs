import GitHub from "github-api";
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

const read_package = async () => {
  const file = await readFile("package.json",{encoding:"utf-8"});
  return JSON.parse(file);
}

const read_signature = async (id) => {
  const file = `Rusty Minecraft Launcher_${id}_x64_en-US.msi.zip.sig`;
  const path = join("src-tauri/target/release/bundle/msi/",file);
 

  const content = await readFile(path,{ encoding: "utf-8"});

  return content;
}

async function create_commit(repo,content){
  return await repo.writeFile("master","latest_version.json",JSON.stringify(content,undefined,2),`Updated latest_version.json`,{ auther: "Tauri updater"});
}

async function fetch_release(repo) {
  const releases = await repo.listReleases();
  const release = releases.data.at(0);
  if(!release) throw new Error("Failed to get the the list of releases.");
  const asset = release.assets.at(1);
  if(!asset) throw new Error("Failed to get the first release");

  return asset;
}

async function main(){
    console.log("Setting up github");
    const gh = new GitHub({
        token: token
    });
    console.log("reading package.json");
    const pack = await read_package();
    const repo = gh.getRepo("VisualSource","rusty-mc-launcher");

    console.log("Fetching lastet release");
    const asset = await fetch_release(repo);
    console.log("Reading update signature")
    const sig = await read_signature(pack.version);
    console.log("Creating update json");
    const update = tauri_update_file(`v${pack.version}`,sig,asset.browser_download_url);
    console.log("Commiting file");
    await create_commit(repo,update);
}

main();







