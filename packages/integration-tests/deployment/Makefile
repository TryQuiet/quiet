REGION=us-east-1
STACK_NAME_1=libp2p-tor-service

PARAMETERS_1=SpamBotImage=896536426663.dkr.ecr.us-east-1.amazonaws.com/bot:latest Subnets=subnet-bf657391,subnet-b19942fc TaskMemory=512 TaskCpu=256

deploy:
	sam deploy --template-file template.yml --stack-name $(STACK_NAME_1) --capabilities CAPABILITY_IAM --region $(REGION) --parameter-overrides='$(PARAMETERS_1)'

destroy:
	aws cloudformation delate-stack --stack-name $(STACK_NAME_1) --region $(REGION)
