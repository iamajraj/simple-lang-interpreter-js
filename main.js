const fs = require("fs");
const readline = require("readline");

const DEFINED_BY = ["let"];

const BUILT_IN_KEYWORDS = new Map();
BUILT_IN_KEYWORDS["println"] = _println;

const PRE_BUILT_FUNCTIONS = new Map();
PRE_BUILT_FUNCTIONS["println"] = (p) => {
    process.stdout.write(String(p) + "\n");
};

const VARIABLES = new Map();

function _println({ rest }) {
    let tokenToPrint = String(rest).slice(" ").trim();
    const func = PRE_BUILT_FUNCTIONS["println"];
    let valueToPass;
    if (tokenToPrint.startsWith(`"`)) {
        valueToPass = tokenToPrint.replaceAll(`"`, "");
    } else if (!isNaN(Number(tokenToPrint))) {
        valueToPass = Number(tokenToPrint);
    } else {
        valueToPass = VARIABLES[tokenToPrint];
        if (!valueToPass) {
            throw new Error(
                `\nThe variable "${tokenToPrint}" is not defined\n\n`
            );
        }
    }
    func(valueToPass);
}

const processIt = async (file_loc) => {
    if (!fs.existsSync(file_loc)) {
        process.stdout.write(
            `\nError -> \nThe file path "${file_loc}" doesn't exists\n\n`
        );
        return;
    }
    const file = fs.createReadStream(file_loc, {
        encoding: "utf-8",
    });

    const rl = readline.createInterface({
        input: file,
        crlfDelay: Infinity,
    });
    try {
        for await (let code_line of rl) {
            let line = code_line;
            if (line.trim() === "") continue;
            line = line.trim().split("=");

            let first_part = line[0].split(" ");
            // first part tokens
            let first_token = first_part[0]?.trim();
            let second_token = first_part[1]?.trim();

            let second_part = line[1];
            if (BUILT_IN_KEYWORDS[first_token]) {
                // handover the task to its corresponding keyword with the remaining token
                BUILT_IN_KEYWORDS[first_token]({
                    rest: code_line.slice(first_token.length),
                });
            } else if (VARIABLES[first_token]) {
                let value = second_part.replaceAll(`"`, "").trim();
                VARIABLES[first_token] = value;
            }
            // DEFINE VARIABLE
            else {
                if (DEFINED_BY.includes(first_token)) {
                    let value = second_part.replaceAll(`"`, "").trim();
                    VARIABLES[second_token] = value;
                } else {
                    throw new Error(
                        `\nUnknown keyword -> "${first_token}"\n\n`
                    );
                }
            }
        }
    } catch (err) {
        process.stdout.write(err.toString());
    }
};

const ARG = process.argv;

if (ARG.length > 2 && ARG[2]) {
    processIt(ARG[2]);
} else {
    process.stdout.write("!! File path is not provided");
}
