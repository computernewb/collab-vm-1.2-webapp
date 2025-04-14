import CollabVMClient from "./CollabVMClient.js";
import VM from "./VM.js";

export async function ListNodes(server: string): Promise<VM[]> {
    // Create the client
    let client = new CollabVMClient(server);

    await client.WaitForOpen();

    // Get the list of VMs
    let list = await client.list();

    // Close the client
    client.close();

    return list;
}