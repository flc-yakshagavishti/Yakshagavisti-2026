import { useState } from "react";
import CollegeReg from "~/components/Forms/CollegeReg";
import LeadRegister from "~/components/Forms/LeadRegister";

export default function CreateTeam() {
	const [FormToShow, setFormToShow] = useState(1);
	const [CollegeId, setCollegeId] = useState("");

	if (FormToShow === 1) {
		return (
			<CollegeReg
				setFormToShow={setFormToShow}
				setCollege={setCollegeId}
			/>
		);
	}

	return (
		<LeadRegister
			setFormToShow={setFormToShow}
			college_id={CollegeId}
		/>
	);
}

