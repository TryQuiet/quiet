import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import CssBaseline from '@mui/material/CssBaseline'
import { INPUT_STATE } from './InputState.enum'

import { ChannelInputComponent, ChannelInputProps } from './ChannelInput'
import { withTheme } from '../../../../storybook/decorators'

import { createLogger } from '../../../../logger'

const logger = createLogger('channelInput:stories')

const Template: ComponentStory<typeof ChannelInputComponent> = args => {
  return (
    <div style={{ height: '400px', position: 'relative' }}>
      <ChannelInputComponent {...args} />
    </div>
  )
}

export const Component = Template.bind({})
export const Disabled = Template.bind({})
export const LongMessage = Template.bind({})

const args: ChannelInputProps = {
  channelId: 'channelId',
  inputPlaceholder: '#general as @alice',
  onChange: function (_arg: string): void {},
  onKeyPress: function (input: string): void {
    logger.info('send message', input)
  },
  infoClass: '',
  setInfoClass: function (_arg: string): void {},
  openFilesDialog: () => {},
  handleOpenFiles: _arg => {},
  handleClipboardFiles: function (arg: ArrayBuffer, ext: string, name: string): void {},
}

const argsDisabledInput: ChannelInputProps = {
  channelId: 'channelId',
  inputPlaceholder: '#general as @alice',
  onChange: function (_arg: string): void {},
  onKeyPress: function (input: string): void {
    logger.info('send message', input)
  },
  infoClass: '',
  setInfoClass: function (_arg: string): void {},
  inputState: INPUT_STATE.NOT_CONNECTED,
  openFilesDialog: () => {},
  handleOpenFiles: _arg => {},
  handleClipboardFiles: function (arg: ArrayBuffer, ext: string, name: string): void {},
}

const initialMessage = `An h1 header
============
Paragraphs are separated by a blank line.
2nd paragraph. *Italic*, **bold**, and monospace. Itemized lists
look like:
* this one
* that one
* the other one
Note that --- not considering the asterisk --- the actual text
content starts at 4-columns in.
> Block quotes are
> written like so.
>
> They can span multiple paragraphs,
> if you like.
Use 3 dashes for an em-dash. Use 2 dashes for ranges (ex., "it's all
in chapters 12--14"). Three dots ... will be converted to an ellipsis.
Unicode is supported. :relaxed:
An h2 header
------------
Here's a numbered list:
1. first item
2. second item
3. third item
Note again how the actual text starts at 4 columns in (4 characters
from the left side). Here's a code sample:
# Let me re-iterate ...
for i in 1 .. 10 { do-something(i) }
As you probably guessed, indented 4 spaces. By the way, instead of
indenting the block, you can use delimited blocks, if you like:
~~~
define foobar() {
print "Welcome to flavor country!";
}
~~~
(which makes copying & pasting easier). You can optionally mark the
delimited block for Pandoc to syntax highlight it:
~~~python
import time
# Quick, count to ten!
for i in range(10):
# (but not *too* quick)
time.sleep(0.5)
print i
~~~
### An h3 header ###
Now a nested list:
1. First, get these ingredients:
* carrots
* celery
* lentils
2. Boil some water.
3. Dump everything in the pot and follow
this algorithm:
find wooden spoon
uncover pot
stir
cover pot
balance wooden spoon precariously on pot handle
wait 10 minutes
goto first step (or shut off burner when done)
Do not bump wooden spoon or it will fall.
Notice again how text always lines up on 4-space indents (including
that last line which continues item 3 above).
Here's a link to [a website](http://foo.bar), to a [local
doc](local-doc.html), and to a [section heading in the current
doc](#an-h2-header). Here's a footnote [^1].
[^1]: Footnote text goes here.
Tables can look like this:
size material color
---- ------------ ------------
9 leather brown
10 hemp canvas natural
11 glass transparent
Table: Shoes, their sizes, and what they're made of
(The above is the caption for the table.) Pandoc also supports
multi-line tables:
-------- -----------------------
keyword text
-------- -----------------------
red Sunsets, apples, and
other red or reddish
things.
green Leaves, grass, frogs
and other things it's
not easy being.
-------- -----------------------
A horizontal rule follows.
***
Here's a definition list:
apples
: Good for making applesauce.
oranges
: Citrus!
tomatoes
: There's no "e" in tomatoe.
Again, text is indented 4 spaces. (Put a blank line between each
term/definition pair to spread things out more.)
Here's a "line block":
| Line one
| Line too
| Line tree
and images can be specified like so:
![example image](example-image.jpg "An exemplary image")
Inline math equations go in like so: $mega = dhi / dt$. Display
math should get its own line and be put in in double-dollarsigns:And note that you can backslash-escape any punctuation characters
which you wish to be displayed literally, ex.: etc.
An h1 header
============
Paragraphs are separated by a blank line.
2nd paragraph. *Italic*, **bold**, and monospace. Itemized lists
look like:
* this one
* that one
* the other one
Note that --- not considering the asterisk --- the actual text
content starts at 4-columns in.
> Block quotes are
> written like so.
>
> They can span multiple paragraphs,
> if you like.
Use 3 dashes for an em-dash. Use 2 dashes for ranges (ex., "it's all
in chapters 12--14"). Three dots ... will be converted to an ellipsis.
Unicode is supported. :relaxed:
An h2 header
------------
Here's a numbered list:
1. first item
2. second item
3. third item
Note again how the actual text starts at 4 columns in (4 characters
from the left side). Here's a code sample:
# Let me re-iterate ...
for i in 1 .. 10 { do-something(i) }
As you probably guessed, indented 4 spaces. By the way, instead of
indenting the block, you can use delimited blocks, if you like:
~~~
define foobar() {
print "Welcome to flavor country!";
}
~~~
(which makes copying & pasting easier). You can optionally mark the
delimited block for Pandoc to syntax highlight it:
~~~python
import time
# Quick, count to ten!
for i in range(10):
# (but not *too* quick)
time.sleep(0.5)
print i
~~~
### An h3 header ###
Now a nested list:
1. First, get these ingredients:
* carrots
* celery
* lentils
2. Boil some water.
3. Dump everything in the pot and follow
this algorithm:
find wooden spoon
uncover pot
stir
cover pot
balance wooden spoon precariously on pot handle
wait 10 minutes
goto first step (or shut off burner when done)
Do not bump wooden spoon or it will fall.
Notice again how text always lines up on 4-space indents (including
that last line which continues item 3 above).
Here's a link to [a website](http://foo.bar), to a [local
doc](local-doc.html), and to a [section heading in the current
doc](#an-h2-header). Here's a footnote [^1].
[^1]: Footnote text goes here.
Tables can look like this:
size material color
---- ------------ ------------
9 leather brown
10 hemp canvas natural
11 glass transparent
Table: Shoes, their sizes, and what they're made of
(The above is the caption for the table.) Pandoc also supports
multi-line tables:
-------- -----------------------
keyword text
-------- -----------------------
red Sunsets, apples, and
other red or reddish
things.
green Leaves, grass, frogs
and other things it's
not easy being.
-------- -----------------------`

const argsLongMessage: ChannelInputProps = {
  channelId: 'channelId',
  inputPlaceholder: '#general as @alice',
  initialMessage: initialMessage,
  onChange: function (_arg: string): void {},
  onKeyPress: function (input: string): void {
    logger.info('send message', input)
  },
  infoClass: '',
  setInfoClass: function (_arg: string): void {},
  openFilesDialog: () => {},
  handleOpenFiles: _arg => {},
  handleClipboardFiles: function (arg: ArrayBuffer, ext: string, name: string): void {},
}

Component.args = args
Disabled.args = argsDisabledInput
LongMessage.args = argsLongMessage

const component: ComponentMeta<typeof ChannelInputComponent> = {
  title: 'Components/ChannelInput',
  decorators: [withTheme],
  component: ChannelInputComponent,
}

export default component
