import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { IoCloseCircle } from "react-icons/io5";
import { FiUploadCloud } from "react-icons/fi";

interface DropzoneProps {
  files: (File & { preview: string })[];
  setFiles: React.Dispatch<
    React.SetStateAction<(File & { preview: string })[]>
  >;
}

const Dropzone = ({ files, setFiles }: DropzoneProps) => {
  const [, setRejectedFiles] = useState<FileRejection[]>([]);

  // detects drag and drop
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (acceptedFiles.length) {
        setFiles((previousFiles) => [
          ...previousFiles,
          ...acceptedFiles.map((file) =>
            Object.assign(file, {
              preview: URL.createObjectURL(file),
            }),
          ),
        ]);
      }
      if (rejectedFiles?.length) {
        setRejectedFiles((previousFiles) => [
          ...previousFiles,
          ...rejectedFiles,
        ]);
      }
    },
    [setFiles],
  );

  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  // accepts images
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png", ".jpg", ".webp"],
    },
    maxFiles: 1,
  });

  // Function for deleting the image
  const handleDelete = (index: number) => {
    setFiles((image) => image.filter((_, id) => id !== index));
  };

  return (
    <div className="w-full">
      {files.length === 0 ? (
        <div
          {...getRootProps({
            role: "button",
            "aria-label": "drag and drop area",
          })}
          className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-all duration-200 sm:p-6 ${
            isDragActive
              ? "border-secondary-100 bg-secondary-100/10"
              : "border-white/20 bg-slate-900/50 hover:border-secondary-100/60 hover:bg-slate-900/80"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100/10 text-secondary-100 group-hover:scale-110 transition-transform sm:h-12 sm:w-12">
            <FiUploadCloud className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <p className="mt-2 text-center text-xs font-medium text-white/90 sm:text-sm">
            {isDragActive ? "Drop the ID card here" : "Upload Teammate ID Card"}
          </p>
          <span className="mt-1 text-center text-[11px] text-white/40">
            Drag & drop or click to browse (PNG, JPG, WebP)
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center pt-1">
          {files.map((image, index) => (
            <div
              className="group relative h-36 w-28 overflow-hidden rounded-xl border border-white/20 bg-slate-900/80 p-1 shadow-lg sm:h-40 sm:w-32"
              key={index}
            >
              <button
                type="button"
                className="absolute right-1.5 top-1.5 z-10 rounded-full bg-black/70 p-0.5 text-red-400 transition-transform hover:scale-110 hover:text-red-300"
                onClick={() => handleDelete(index)}
                title="Remove image"
              >
                <IoCloseCircle className="text-xl sm:text-2xl" />
              </button>
              <Image
                src={image.preview}
                alt="ID Card Preview"
                className="h-full w-full rounded-lg object-contain object-center"
                height={160}
                width={128}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropzone;
