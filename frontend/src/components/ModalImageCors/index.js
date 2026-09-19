import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import api from "../../services/api";

const useStyles = makeStyles(() => ({
  messageMedia: {
    cursor: "pointer",
    objectFit: "cover",
    width: 250,
    height: 200,
    borderRadius: 8
  },
  expandedMedia: {
    display: "block",
    maxWidth: "100%",
    maxHeight: "80vh",
    margin: "auto"
  }
}));

const ModalImageCors = ({ imageUrl }) => {
  const classes = useStyles();
  const [blobUrl, setBlobUrl] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!imageUrl) return undefined;

    let active = true;
    let objectUrl;

    const fetchImage = async () => {
      try {
        const { data, headers } = await api.get(imageUrl, {
          responseType: "blob"
        });
        objectUrl = window.URL.createObjectURL(
          new Blob([data], { type: headers["content-type"] })
        );
        if (active) setBlobUrl(objectUrl);
      } catch {
        if (active) setBlobUrl("");
      }
    };

    fetchImage();

    return () => {
      active = false;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [imageUrl]);

  const source = blobUrl || imageUrl;

  return (
    <>
      <img
        className={classes.messageMedia}
        src={source}
        alt="message attachment"
        onClick={() => setOpen(true)}
      />
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md">
        <DialogContent>
          <img className={classes.expandedMedia} src={source} alt="message attachment" />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ModalImageCors;
