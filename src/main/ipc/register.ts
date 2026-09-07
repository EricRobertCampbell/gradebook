import { ipcMain } from "electron";
import {
  ipcChannels,
  ipcContracts,
  type IpcChannel,
  type IpcInput,
  type IpcOutput,
} from "../../shared/ipc";

export function registerIpcHandler<C extends IpcChannel>(
  channel: C,
  handler: (input: IpcInput<C>) => IpcOutput<C> | Promise<IpcOutput<C>>,
): void {
  ipcMain.handle(channel, async (_event, rawInput: unknown) => {
    const input = parseIpcInput(channel, rawInput);
    const output = await handler(input);
    return ipcContracts[channel].output.parse(output);
  });
}

export { ipcChannels };

function parseIpcInput<C extends IpcChannel>(channel: C, rawInput: unknown): IpcInput<C> {
  if (isIpcInput(channel, rawInput)) {
    return rawInput;
  }

  ipcContracts[channel].input.parse(rawInput);
  throw new Error("The IPC payload did not match the contract.");
}

function isIpcInput<C extends IpcChannel>(channel: C, value: unknown): value is IpcInput<C> {
  return ipcContracts[channel].input.safeParse(value).success;
}
