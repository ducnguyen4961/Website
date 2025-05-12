import { CognitoUserPool } from "amazon-cognito-identity-js";

const poolData = {
    UserPoolId: "ap-northeast-1_5RFZ7tKmp",
    ClientId: "5eid7801fqgv7qu4pjdc7s4pm1",
};

export default new CognitoUserPool(poolData);
