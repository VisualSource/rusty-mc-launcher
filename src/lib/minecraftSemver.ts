/*
    1.20.6 > 1.20.6-rc1 > 1.20.6-pre4 > 24w14a
    1.20
    1.20.0
    24w18a
    1.20.6-rc1
    1.20.5-pre4

    23w13a_or_b
    24w14potato
*/

type SnapshotVersion = {
  type: "snapshot";
  year: number;
  week: number;
  identifier: string;
};

type ReleaseVersion = {
  type: "release";
  major: number;
  minor: number;
  patch: number;
  rc: number | null;
  pre: number | null;
};

export class MinecraftSemver {
  static parse(version: string): SnapshotVersion | ReleaseVersion {
    const isSnapshot = !version.includes(".");

    if (isSnapshot) {
      const data = version.match(/(?<year>\d+)w(?<week>\d+)(?<identifier>.+)/);
      if (!data || !data?.groups)
        throw new Error("Failed to parse snapshot version.");

      return {
        type: "snapshot",
        year: parseInt(data.groups.year),
        week: parseInt(data.groups.week),
        identifier: data.groups.identifier,
      };
    }

    const [addition, candidate] = version.split("-");

    let release_candidate: number | null = null;
    let prerelease: number | null = null;
    if (candidate) {
      if (candidate.startsWith("rc")) {
        release_candidate = parseInt(candidate.replace("rc", ""));
      } else if (candidate.startsWith("pre")) {
        prerelease = parseInt(candidate.replace("pre", ""));
      }
    }

    const [major, minor, patch] = addition.split(".");

    return {
      type: "release",
      major: parseInt(major),
      minor: parseInt(minor),
      patch: parseInt(patch ?? "0"),
      rc: release_candidate,
      pre: prerelease,
    };
  }

  // 1.20.6 > 1.20.6-rc1 > 1.20.6-pre4 > 24w14a
  static gt(a: string, b: string): boolean {
    const va = this.parse(a);
    const vb = this.parse(b);

    if (va.type === "release" && vb.type === "release") {
      if (va.major > vb.major) return true;
      if (va.major > vb.minor) return true;
      if (va.patch > vb.patch) return true;

      if (
        va.rc === null &&
        va.pre === null &&
        (vb.rc !== null || vb.pre !== null)
      )
        return true;
      if (va.rc !== null && vb.rc === null && vb.pre !== null) return true;

      if (va.rc !== null && vb.rc !== null && va.rc > vb.rc) return true;
      if (va.pre !== null && vb.pre !== null && va.pre > vb.pre) return true;

      return false;
    }

    if (va.type === "snapshot" && vb.type === "snapshot") {
      if (va.year > vb.year) return true;
      if (va.week > vb.week) return true;

      if (
        va.identifier.length === 1 &&
        vb.identifier.length === 1 &&
        va.identifier.charCodeAt(0) > vb.identifier.charCodeAt(0)
      ) {
        return true;
      }

      return false;
    }

    return false;
  }
}
