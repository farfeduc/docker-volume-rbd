import util from 'util';
import child_process from "child_process";
const execFile = util.promisify(child_process.execFile);
import fs from "fs";

export default class Rbd {
    constructor(readonly options: { pool: string }) { }

    async isMapped(name: string): Promise<string> {
        let mapped: any[];
    
        try {
            const { stdout, stderr } = await execFile("rbd", ["showmapped", "--format", "json"], { timeout: 30000 });
            if (stderr) throw new Error(stderr);
    
            mapped = JSON.parse(stdout);
        }
        catch (error) {
            console.error(error);
            throw new Error(`rbd showmapped command failed with code ${error.code}: ${error.message}`);
        }
    
        const entry = mapped.find(i => i.pool === this.options.pool && i.name === name);

        if (!entry) {
            return null;
        }

        return entry.device;
    }

    // Check if remote host has alreaddy mapped the rbd image by checking locks. If lock exists then get lock, else null.
    async isMappedRemote(name: string): Promise<string> {
        let locks: any[];

        try {
            const { stdout, stderr } = await execFile("rbd", ["lock", "ls","--pool", this.options.pool, name, "--format", "json"], { timeout: 30000 });
            if (stderr) throw new Error(stderr);
    
            locks = JSON.parse(stdout);
        }
        catch (error) {
            console.error(error);
            throw new Error(`rbd locks ls command failed with code ${error.code}: ${error.message}`);
        }

        if (locks.length === 0){
            return null
        }

        return locks[0]
    }
    
    async map(name: string): Promise<string> {
        let alreadyMapped = await this.isMapped(name);

        if (alreadyMapped){
            return alreadyMapped;
        }

        //check if rbd is already mapped elsewhere, if yes then throw to exit.
        let alreadyMappedRemote = await this.isMappedRemote(name);
        if (alreadyMappedRemote){
            throw new Error(`rbd already mapped on another host with lock ${alreadyMappedRemote}`);
        }

        try {
            const { stdout, stderr } = await execFile("rbd", ["map", "--pool", this.options.pool, name], { timeout: 30000 });
            if (stderr) console.log(stderr);
    
            return (stdout as string).trim();
        }
        catch (error) {
            console.error(error);
            throw new Error(`rbd map command failed with code ${error.code}: ${error.message}`);
        }
        
    }
    
    async unMap(name: string): Promise<void> {
        let mustUnmap = await this.isMapped(name);
    
        if (mustUnmap) {
            try {
                const { stdout, stderr } = await execFile("rbd", ["unmap", "--pool", this.options.pool, name], { timeout: 30000 });
                if (stderr) console.log(stderr);
                if (stdout) console.log(stdout);
            }
            catch (error) {
                console.error(error);
                throw new Error(`rbd unmap command failed with code ${error.code}: ${error.message}`);
            }
        }
    }

    async list(): Promise<{ image: string, id: string, size: number, format: number }[]> {
        try {
            const { stdout, stderr } = await execFile("rbd", ["list", "--pool", this.options.pool, "--long", "--format", "json"], { timeout: 30000 });
            if (stderr) console.log(stderr);
            
            return JSON.parse(stdout);
        }
        catch (error) {
            console.error(error);
            throw new Error(`rbd list command failed with code ${error.code}: ${error.message}`);
        }
    }
    
    async getInfo(name: string): Promise<{ image: string, id: string, size: number, format: number }> {
        let rbdList = await this.list();
    
        return rbdList.find(i => i.image === name);
    }

    async create(name: string, size: string): Promise<void> {
        try {
            const { stdout, stderr } = await execFile("rbd", ["create", "--pool", this.options.pool, name, "--size", size, "--image-feature", "exclusive-lock"], { timeout: 30000 });
            if (stderr) console.log(stderr);
            if (stdout) console.log(stdout);
        }
        catch (error) {
            console.error(error);
            throw new Error(`rbd create command failed with code ${error.code}: ${error.message}`);
        }
    }

    async makeFilesystem(device: string) {
        try {
            // until xfsprogs 5.11 is not available, we will not be able to use bigtime
            //const { stdout, stderr } = await execFile("mkfs", ["-t", "xfs", "-m", "bigtime=1", device], { timeout: 120000 });
            const { stdout, stderr } = await execFile("mkfs", ["-t", "xfs", device], { timeout: 120000 });
            if (stderr) console.error(stderr);
            if (stdout) console.log(stdout);
        }
        catch (error) {
            console.error(error);
            throw Error(`mkfs -t xfs ${device} command failed with code ${error.code}: ${error.message}`);
        }
    }

    async remove(name: string): Promise<void> {
        try {
            const { stdout, stderr } = await execFile("rbd", ["trash", "move", "--pool", this.options.pool, name], { timeout: 30000 });
            if (stderr) console.log(stderr);
            if (stdout) console.log(stdout);
        }
        catch (error) {
            console.error(error);
            throw new Error(`rbd remove command failed with code ${error.code}: ${error.message}`);
        }
    }

    async mount(device: string, mountPoint: string): Promise<void> {
        fs.mkdirSync(mountPoint, { recursive: true });

        try {
            const { stdout, stderr } = await execFile("mount", [device, mountPoint, "-o", "noatime,nodiratime"], { timeout: 120000 });
            if (stderr) console.error(stderr);
            if (stdout) console.log(stdout);
        }
        catch (error) {
            console.error(error);
            throw new Error(`mount command failed with code ${error.code}: ${error.message}`);
        }
    }

    async unmount(mountPoint: string): Promise<void> {
        try {
            const { stdout, stderr } = await execFile("umount", [mountPoint], { timeout: 120000 });
            if (stderr) console.error(stderr);
            if (stdout) console.log(stdout);
        }
        catch (error) {
            console.error(error); 
            throw new Error(`umount command failed with code ${error.code}: ${error.message}`);
        }

        fs.rmdirSync(mountPoint);
    }
}
