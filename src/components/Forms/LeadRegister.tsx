"use client";

import React, { type Dispatch, type SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Button as RegButton } from "~/components/Button";
import { ImSpinner9 } from "react-icons/im";
import { IoCheckmarkCircle } from "react-icons/io5";
import {
	Form,
	FormItem,
	FormField,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import {
	DialogContent,
	DialogDescription,
	Dialog,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import Dropzone from "../Dropzone";
import { toast } from "../ui/use-toast";
import { api } from "~/trpc/react";
import { uploadFile } from "~/utils/file";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { IoCloseCircle } from "react-icons/io5";

const LeadRegister = ({
	setFormToShow,
	college_id,
}: {
	college_id: string;
	setFormToShow: Dispatch<SetStateAction<number>>;
}) => {
	const user = useSession();
	const [files, setFiles] = useState<(File & { preview: string })[]>([]);
	const [LeaderContact, setLeaderContact] = useState<string>("");
	const [LeaderName, setLeaderName] = useState<string>(user.data?.user.name ?? "");
	const [LeaderIdUrl, setLeaderIdUrl] = useState<string>("");
	const [UploadStatus, setUploadStatus] = useState("");

	const SetLeaderDetails = api.team.register.useMutation({
		onError(error) {
			return toast({
				variant: "destructive",
				description: error.message,
			});
		},
		onSuccess(data) {
			return toast({
				variant: "default",
				title: "Team registered successfully!",
				description: data.message,
			});
		},
	});
	const form = useForm();

	const handleUpload = async () => {
		setUploadStatus("Uploading....");
		try {
			if (files[0] instanceof File) {
				const result = await uploadFile(files[0]);
				if (result) {
					setLeaderIdUrl(result);
					setUploadStatus("Upload Successful");
					return result;
				}
			}
		} catch (error) {
			console.log(error);
			setUploadStatus("Upload Failed...");
		}
	};

	// Field Validation for Team Lead
	const Passwordpattern = () => {
		const phoneregx = "^[6-9][0-9]{9}$";
		if (!new RegExp(phoneregx).exec(LeaderContact)) {
			toast({
				variant: "destructive",
				title: "Invalid Phone number!",
				description: "Check the entered phone number.",
			});
			return false;
		}

		if (files.length === 0) {
			toast({
				variant: "destructive",
				title: "No ID uploaded!",
				description: "Please upload your ID.",
			});
			return false;
		}

		if (files.length > 1) {
			toast({
				variant: "destructive",
				title: "Only one ID allowed!",
				description: "Please upload only one ID.",
			});
			return false;
		}

		handleUpload()
			.then((idUrl) => {
				if (!idUrl) return;

				SetLeaderDetails.mutate({
					college_id,
					leader_name: LeaderName,
					leader_contact: LeaderContact,
					leader_idUrl: idUrl,
				});
			})
			.catch((err) => console.log(err));
	};

	return (
		<Dialog defaultOpen={true}>
			<DialogTrigger>
				<RegButton>Create Team</RegButton>
			</DialogTrigger>
			<DialogContent className="overflow-y-scroll bg-[conic-gradient(at_top_left,_var(--tw-gradient-stops))] from-gray-950/50 via-slate-900 to-black text-white sm:max-w-[425px]">
				{SetLeaderDetails.isSuccess ? (
					<div className="flex flex-col items-center justify-center gap-4 py-6">
						<IoCheckmarkCircle className="h-16 w-16 text-green-500" />
						<DialogTitle className="text-center text-xl text-white">
							Team Registered Successfully!
						</DialogTitle>
						<DialogDescription className="text-center text-gray-300">
							{SetLeaderDetails.data?.message ?? "Your team details have been registered successfully."}
						</DialogDescription>
						<Button
							className="mt-4 cursor-pointer bg-white text-black hover:bg-gray-200"
							onClick={() => {
								window.location.reload();
							}}
						>
							OK
						</Button>
					</div>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>Create Team</DialogTitle>
							<DialogDescription>
								Fill in the information below. Click Submit when you&apos;re done.
							</DialogDescription>
						</DialogHeader>
						<div className="grid">
							<Form {...form}>
								<form className="space-y-8 flex flex-col">
									<FormField
										control={form.control}
										name="username"
										render={() => (
											<FormItem>
												<div className="flex flex-col space-y-4">
													<div className="grid w-full max-w-sm items-center gap-1.5">
														<Label htmlFor="lead_name">
															Leader Name
														</Label>
														<Input
															type="text"
															id="lead_name"
															placeholder="Enter your Name"
															className="col-span-3 text-black"
															defaultValue={LeaderName}
															onChange={(e) => {
																setLeaderName(
																	e.target.value
																);
															}}
														/>
													</div>
													<div className="grid w-full max-w-sm items-center gap-1.5">
														<Label htmlFor="phone">
															Phone number
														</Label>
														<Input
															type="tel"
															id="phone"
															placeholder="Enter your Phone number"
															className="col-span-3 text-black"
															maxLength={10}
															minLength={10}
															defaultValue={LeaderContact}
															onChange={(e) => {
																setLeaderContact(
																	e.target.value
																);
															}}
														/>
													</div>
												</div>

												<div className="grid grid-cols-3 mt-4">
													<FormLabel className="col-span-3 mb-2 text-white">
														Upload ID Card
													</FormLabel>
													{!LeaderIdUrl ? (
														<div className="col-span-3">
															<Dropzone
																files={files}
																setFiles={setFiles}
															/>
														</div>
													) : (
														<div className="relative w-fit">
															<Image
																src={LeaderIdUrl}
																alt="Leader ID"
																height={100}
																width={100}
															/>
															<IoCloseCircle
																className="absolute right-3 top-1 cursor-pointer text-xl text-red-600 md:text-2xl"
																onClick={() => setLeaderIdUrl("")}
															/>
														</div>
													)}
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>
									<div className="flex justify-between items-center mt-4">
										<Button
											type="button"
											size="sm"
											variant="secondary"
											className="cursor-pointer"
											onClick={() => setFormToShow(1)}
										>
											Back
										</Button>
										{UploadStatus === "Uploading...." || SetLeaderDetails.isPending ? (
											<Button
												type="submit"
												size="sm"
												className="w-[30%] self-center"
												disabled
											>
												<ImSpinner9 className="animate-spin" />
											</Button>
										) : (
											<Button
												type="submit"
												size="sm"
												className="bg-white text-black hover:bg-black hover:text-white cursor-pointer w-[30%] self-center"
												onClick={(e) => {
													e.preventDefault();
													Passwordpattern();
												}}
											>
												Submit
											</Button>
										)}
									</div>
								</form>
							</Form>
						</div>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
};
export default LeadRegister;
