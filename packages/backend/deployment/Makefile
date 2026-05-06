REGION=us-east-1
STACK_NAME_1=libp2p-tor-service
# TODO: Remove HiddenServicePrivateKey, keep only on aws
PARAMETERS_1=HiddenServicePrivateKey=ED25519-V3:cHmSdEN9gCrNiYkm5xw7wP94SsWVHc3QEHJ6Y76Hw2nENv/Qwo71YCVbezoCqneiPIuNLnybgM221Z7Ds608Cw== Libp2pTorImage=896536426663.dkr.ecr.us-east-1.amazonaws.com/libp2p-tor-service:latest Subnets=subnet-bf657391,subnet-b19942fc TaskMemory=2048 TaskCpu=1024

deploy:
	sam deploy --template-file template.yml --stack-name $(STACK_NAME_1) --capabilities CAPABILITY_IAM --region $(REGION) --parameter-overrides='$(PARAMETERS_1)'

destroy:
	aws cloudformation delate-stack --stack-name $(STACK_NAME_1) --region $(REGION)
