import * as apprunner from "@aws-cdk/aws-apprunner-alpha";
import * as cdk from "aws-cdk-lib";
import { CfnOutput, SecretValue } from "aws-cdk-lib";
import { SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import * as assets from 'aws-cdk-lib/aws-ecr-assets';
import * as secrets from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export class AwsApprunnerDeployStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpcId: string | undefined = process.env["vpcId"];
    const env = JSON.parse(process.env["hereyaProjectEnv"] ?? ("{}" as string));
    const hereyaProjectRootDir: string = process.env[
      "hereyaProjectRootDir"
    ] as string;
    if (!hereyaProjectRootDir) {
      throw new Error("hereyaProjectRootDir context variable is required");
    }

    const vpcSubnetType = process.env["vpcSubnetType"] || SubnetType.PUBLIC;

    // Look up the VPC using the parameter value
    const vpc = vpcId
      ? Vpc.fromLookup(this, "MyVpc", {
          vpcId,
        })
      : Vpc.fromLookup(this, "MyVpc", {
          isDefault: true,
        });

    const secretEnv = Object.fromEntries(
      Object.entries(env)
        .filter(([, value]) => (value as string).startsWith("secret://"))
        .map(([key, value]) => {
          const plainValue = (value as string).split("secret://")[1];

          const secret = new secrets.Secret(this, key, {
            secretName: `/${this.stackName}/${key}`,
            secretStringValue: SecretValue.unsafePlainText(plainValue),
          });
          return [key, apprunner.Secret.fromSecretsManager(secret)];
        })
    );
    const plainEnv = Object.fromEntries(
      Object.entries(env).filter(
        ([, value]) => !(value as string).startsWith("secret://")
      )
    );

    const vpcConnector = new apprunner.VpcConnector(this, "VpcConnectorV2", {
      vpc,
      vpcSubnets: vpc.selectSubnets({
        subnetType: vpcSubnetType as SubnetType,
      }),
    });

    const imageAsset = new assets.DockerImageAsset(this, 'ImageAssets', {
      directory: hereyaProjectRootDir,
    });

    const service = new apprunner.Service(this, "Service", {
      source: apprunner.Source.fromAsset({
        imageConfiguration: {
          port: 8080,
          environmentVariables: {
            PORT: "8080",
            ...plainEnv,
          },
          environmentSecrets: secretEnv,
        },
        asset: imageAsset,
      }),
      autoDeploymentsEnabled: true,
      vpcConnector,
    });

    new CfnOutput(this, "ServiceUrl", {
      value: `https://${service.serviceUrl}`,
    });
  }
}
