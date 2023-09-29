import { App, Stack, StackProps, Duration, Tag } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class Ec2InstanceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a VPC
    const vpc = new ec2.Vpc(this, 'MyVpc', {
      maxAzs: 3, // Adjust as needed
    });

    // Define an EC2 instance role
    const instanceRole = new iam.Role(this, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    // Add permissions to the instance role as needed

    // Create a Lambda function to start and stop instances
    const lambdaFunction = new lambda.Function(this, 'InstanceControlFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'InstanceControlFunction.handler',
      code: lambda.Code.fromAsset('lambda'), // Path to your Lambda code
      environment: {
        VPC_ID: vpc.vpcId,
      },
      role: instanceRole,
    });

    // Create 5 EC2 instances with the same tag to group them
    for (let i = 0; i < 5; i++) {
      new ec2.Instance(this, `EC2Instance${i}`, {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
        machineImage: ec2.MachineImage.fromSsmParameter('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'),
        vpc: vpc,
        role: instanceRole,
        userData: ec2.UserData.custom('Your user data script here'),
        tags: {
            MyGroupTagKey: 'MyGroupTagValue', // Use the same tag key and value for all instances
        } as any,
      });
    }

    // Grant Lambda permissions to describe and terminate instances
    lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ec2:DescribeInstances', 'ec2:TerminateInstances'],
        resources: ['*'], // Be cautious about using a wildcard in production
      })
    );

    // Create a CloudWatch Events rule to trigger the Lambda function periodically
    const rule = new lambda.EventRule(this, 'InstanceControlRule', {
      schedule: lambda.Schedule.rate(Duration.minutes(1)), // Run every 1 minute
    });
    rule.addTarget(lambdaFunction);
  }
}

const app = new App();
new Ec2InstanceStack(app, 'Ec2InstanceStack');
