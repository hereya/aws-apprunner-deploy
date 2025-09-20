# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AWS CDK TypeScript project that provides a Hereya package for deploying applications to AWS App Runner. It's designed to work with the Hereya CLI to deploy containerized applications with automatic VPC integration and environment variable management.

## Commands

### Build and Development
- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for TypeScript changes and recompile
- `npm test` - Run Jest tests

### CDK Operations
- `npm run cdk synth` - Synthesize CloudFormation template
- `npm run cdk deploy` - Deploy stack to AWS
- `npm run cdk destroy` - Remove stack from AWS
- `npm run cdk diff` - Compare deployed stack with current state

### Hereya Integration
- `hereya deploy -w <workspace>` - Deploy using Hereya CLI (requires workspace name)

## Architecture

### Core Stack: AwsApprunnerDeployStack

The main deployment stack (`lib/aws-apprunner-deploy-stack.ts`) creates an AWS App Runner service with:

1. **VPC Integration**: Configures VPC connector for network connectivity
   - Uses provided `vpcId` or defaults to the default VPC
   - Configurable subnet type via `vpcSubnetType` (defaults to PUBLIC)

2. **Environment Variables**: Two-tier management system
   - Plain environment variables passed directly
   - Secrets (prefixed with `secret://`) stored in AWS Secrets Manager

3. **Docker Image**: Built from the project root directory specified by `hereyaProjectRootDir`
   - Requires a Dockerfile in the project root
   - Configured for port 8080 by default

4. **Required Environment Variables**:
   - `STACK_NAME`: Name of the CloudFormation stack
   - `hereyaProjectRootDir`: Path to the project containing the Dockerfile
   - `hereyaProjectEnv`: JSON string of environment variables (optional)
   - `vpcId`: VPC ID for deployment (optional, defaults to default VPC)
   - `vpcSubnetType`: Subnet type for VPC connector (optional)

## Key Dependencies

- **@aws-cdk/aws-apprunner-alpha**: Alpha version of App Runner CDK constructs
- **aws-cdk-lib**: Core CDK library (v2.144.0)
- **TypeScript**: Configured with strict type checking

## Deployment Flow

1. Hereya CLI sets required environment variables
2. CDK app instantiates `AwsApprunnerDeployStack`
3. Stack creates Docker image asset from project directory
4. Configures App Runner service with VPC, environment variables, and secrets
5. Outputs the service URL after deployment