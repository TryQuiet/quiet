REGION=us-east-1
STACK_NAME_1=tor-connection-test

PARAMETERS_1=TorTestImage=896536426663.dkr.ecr.us-east-1.amazonaws.com/tor-connection-test:latest Subnets=subnet-bf657391,subnet-b19942fc TaskMemory=4096 TaskCpu=1024

deploy:
	sam deploy --template-file template.yml --stack-name $(STACK_NAME_1) --capabilities CAPABILITY_IAM --region $(REGION) --parameter-overrides='$(PARAMETERS_1)'

destroy:
	aws cloudformation delete-stack --stack-name $(STACK_NAME_1) --region $(REGION)