export const getLoaderType = (
  lastVersionId: string,
  parseLastest: boolean = false,
): { loader?: string; type: "fabric" | "forge" | "vanilla"; game: string } => {






  const fabricResults = lastVersionId.match(
    /fabric-loader-(?<loader>\d+.\d+.\d+)-(?<game>\d+.\d+(.\d+)?(.+))/,
  );
  if (fabricResults) {
    return {
      type: "fabric",
      game: fabricResults.groups?.game as string,
      loader: fabricResults.groups?.loader,
    };
  }

  const forgeResults = lastVersionId.match(
    /(?<game>\d+.\d+(.\d+)?(.+))-forge-(?<loader>\d+.\d+.\d+)/,
  );
  if (forgeResults) {
    return {
      type: "forge",
      game: forgeResults.groups?.game as string,
      loader: forgeResults.groups?.loader,
    };
  }

  return {
    type: "vanilla",
    game: lastVersionId,
  };
};
