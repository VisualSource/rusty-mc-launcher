import { useContext } from "react";
import { DownloadContext } from "@context/DownloadContext";

const useDownload = () => {
  const context = useContext(DownloadContext);
  if (!context)
    throw new Error("useDownload needs to be wraped in a DownloadProvider");
  return context;
};

export default useDownload;
