import { fstatSync, lstatSync, type BigIntStats } from "node:fs";
import { sameRegularFileState } from "../../src/filesystem/RegularFile.js";
import { diagnostic } from "./limits.ts";

export function fileState(metadata: BigIntStats) {
  return {
    size_bytes: String(metadata.size),
    device: String(metadata.dev),
    inode: String(metadata.ino),
    mode_bits: String(metadata.mode),
    modified_ns: String(metadata.mtimeNs),
    changed_ns: String(metadata.ctimeNs),
    file_type: metadata.isFile()
      ? "regular"
      : metadata.isSymbolicLink()
        ? "symlink"
        : "other",
  };
}

function observe(initial: BigIntStats, read: () => BigIntStats) {
  try {
    const observed = read();
    return {
      state: fileState(observed),
      matches_initial: sameRegularFileState(initial, observed),
      error: null,
    };
  } catch (cause) {
    return {
      state: null,
      matches_initial: null,
      error: diagnostic(cause, "io"),
    };
  }
}

export function observeFileState(
  fd: number,
  path: string,
  initial: BigIntStats,
) {
  return {
    descriptor: observe(initial, () => fstatSync(fd, { bigint: true })),
    path: observe(initial, () => lstatSync(path, { bigint: true })),
  };
}
