export const up = async (db, client) => {
    // Data preparation
    const caseStagesArr = [
      "Agreement",
      "Arguments",
      "Charge",
      "Evidence",
      "Judgement",
      "Plaintiff Evidence",
      "Remand",
    ];
    const nameOfCourts = [
      "ACJM Court",
      "CJM Court",
      "Criminal Court",
      "High Court",
      "SDM Court",
      "Session Court",
      "Supreme Court",
    ];
    const particularsArr = [
      "125 crpc maintainance",
      "alternation maintainance allowance",
      "Application under section 102 crpc",
      "application under section 82 - 83",
      "Bail applicaiton",
      "cfr",
      "Civil misc appeal",
      "civil misc connected",
      "civil misc non connected",
      "civil regular appeal",
      "civil revision",
      "civil suit",
      "complaint",
      "cooperative appeal",
      "coopeartive referral",
      "cooperative review",
      "cr appeal",
      "cr case complaint (o)",
      "cr case complaint (p)",
      "cr misc case",
      "cr reg case",
      "cr revision",
      "cri case",
      "criminal misc",
      "criminal mislanious",
      "domestic violence act 2005",
      "drc dra case",
      "edu tribunal appeal",
      "edu tribunal application",
      "edu tribunal misc",
      "excise act",
      "execution",
      "family main case",
      "family misc case",
      "final report",
      "JDA Appeal",
      "JDA Contempt",
      "JDA Referance",
      "Labour Industrial appeal",
      "Labour industrial main case",
      "Labour industrial misc case",
      "Land accusition case",
      "MACT main case",
      "MACT misc case",
      "Other misc case",
      "Recover of maintainance 125",
      "REG cri case",
      "Rent appeal case",
      "Rent case",
      "Session case",
    ];
    
    // Add the code insertion logic in here
    caseStagesArr.forEach(async (item) => {
      await db.collection("current-stage").insertOne({
        name: item,
        created_at: new Date(),
        updated_at: new Date(),
      });
    });

    nameOfCourts.forEach(async (item) => {
      await db.collection("court-name").insertOne({
        name: item,
        created_at: new Date(),
        updated_at: new Date(),
      });
    });

    particularsArr.forEach(async (item) => {
      await db.collection("particulats").insertOne({
        name: item,
        created_at: new Date(),
        updated_at: new Date(),
      });
    });
};

export const down = async (db, client) => {
    await db.collection("current-stage").deleteMany({});
    await db.collection("court-name").deleteMany({});
    await db.collection("particulats").deleteMany({});
};
