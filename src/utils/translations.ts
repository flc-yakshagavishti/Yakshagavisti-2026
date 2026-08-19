export const getAchievements = (t: (key: string) => string) => {
    const achievements = [];

    for (let i=0; i<14; i++) {
        const title = t(`Events.${i}.Title`);
        const team = t(`Events.${i}.Team`);
        const image = t(`Events.${i}.Image`);

        const individual: string[] = [];
        for (let j = 0; j < 5; j++) {
            const indiv = t(`Events.${i}.Individual.${j}`)
            if (indiv) individual.push(indiv)
        }

        achievements.push({ title, team, image, individual });
    }

    return {
        heading: t("Heading"),
        description: t("Description"),
        achievements
    }
}

export const getFacultyAndFounder = (t: (key: string) => string) => {
    const members = [];

    for (let i=0; i<3; i++) {
        const name = t(`${i}.name`);
        const role = t(`${i}.role`);
        const url = t(`${i}.url`);

        members.push({ name, role, url });
    }

    return members;
}

export const getMembers = (t: (key: string) => string) => {
    const members = [];

    for (let i=3; i<21; i++) {
        const name = t(`${i}.name`);
        const role = t(`${i}.role`);
        const url = t(`${i}.url`);

        members.push({ name, role, url });
    }

    return members;
}

export const getMembers2025_26 = (t: (key: string) => string) => {
    const members = [];

    for (let i=21; i<37; i++) {
        const name = t(`${i}.name`);
        const role = t(`${i}.role`);
        const url = t(`${i}.url`);
        const rotation = t(`${i}.rotation`);

        members.push({ 
            name, 
            role, 
            url,
            ...(rotation && rotation !== `${i}.rotation` ? { rotation: Number(rotation) } : {})
        });
    }

    return members;
}