result = dict()

with open('data.txt') as f:
  data = f.readlines()
  for line in data:
    oneLineData = line.split(' ')
    user_existing_data = result.get(oneLineData[0])
    if (user_existing_data):
      user_existing_data.update({oneLineData[1]: oneLineData[2]})
      result.update({oneLineData[0]: user_existing_data})
    else:
      result.update({oneLineData[0]: {oneLineData[1]: oneLineData[2]}})

print(result)

with open(f"result3.txt", 'a') as f:
  for user_name, user_data in result.items():
    f.write(f"{user_name.strip()} {user_data['average:'].strip()} {user_data['max:'].strip()}\n")