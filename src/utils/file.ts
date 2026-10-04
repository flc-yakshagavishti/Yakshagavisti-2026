import { env } from "~/env";

type CloudinaryResponse = {
  signature: string;
  timestamp: string;
};

type UploadedImage = {
  secure_url?: string;
  url?: string;
};

export async function uploadFile(file: File) {
  const res = await fetch("/api/cloudinary/sign", {
    method: "POST",
  });
  const { signature, timestamp } = (await res.json()) as CloudinaryResponse;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", env.NEXT_PUBLIC_CLOUDINARY_API_KEY);
  formData.append("signature", signature);
  formData.append("timestamp", timestamp);
  formData.append("folder", "Yakshagavishti/ID Cards");
  console.log(signature, timestamp);

  const endpoint = `https://api.cloudinary.com/v1_1/${env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });
  const data = (await response.json()) as UploadedImage;
  if (!response.ok || (!data.secure_url && !data.url)) {
    throw new Error("Cloudinary did not return an image URL.");
  }

  return data.secure_url ?? data.url!;
}
