import * as AWS from 'aws-sdk';

export async function handler(event: any): Promise<void> {
  // Create an EC2 service object
  const ec2 = new AWS.EC2();

  try {
    // Describe instances with a common tag key and value
    const describeInstancesParams: AWS.EC2.DescribeInstancesRequest = {
      Filters: [
        {
          Name: 'tag:Environment', // Modify this to match the key you used
          Values: ['Production'], // Modify this to match the value you used
        },
        {
          Name: 'tag:EC2TagGroup', // Modify this to match the key you used
          Values: ['CloudGroup'], // Modify this to match the value you used
        },
      ],
    };

    const instances = await ec2.describeInstances(describeInstancesParams).promise();

    // Terminate the instances
    const instanceIds = instances.Reservations?.map((reservation) =>
      reservation.Instances?.map((instance) => instance.InstanceId)
    ).flat();

    if (instanceIds && instanceIds.length > 0) {
      const terminateParams: AWS.EC2.TerminateInstancesRequest = {
        InstanceIds: instanceIds,
      };

      await ec2.terminateInstances(terminateParams).promise();

      console.log(`Terminated instances: ${instanceIds.join(', ')}`);
    } else {
      console.log('No instances found to terminate.');
    }
  } catch (error) {
    console.error('Error terminating instances:', error);
  }
}