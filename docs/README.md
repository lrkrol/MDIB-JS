# Multi-Dimensional Image Browser

This is the repository for a browser-based multi-dimensional image browser. [See an online version here.](https://mdib.lrk.tools) An offline, Python-based version can be found [here](https://github.com/lrkrol/Multi-Dimensional-Image-Browser).

![Screenshot](./docs/mdib.png)

Rather than browsing through image files in alphabetical order, this script allows them to be browsed through in a multi-dimensional fashion. Take for example the following files:

```
apple-brown.jpg     banana-brown.jpg      pear-brown.jpg
apple-green.jpg     banana-green.jpg      pear-green.jpg
apple-yellow.jpg    banana-yellow.jpg     pear-yellow.jpg
```

Regular alphabetical ordering would have you browse first through all apples, colour by colour, then through the bananas, colour by colour, and then the pears. These files, however, contain two dimensions: fruit type, and fruit colour. This script makes it possible to jump from the green banana to the green apple with one button, and from the green apple to the yellow apple with another.

Simply supply it with the image files you want, and the pattern with which the files are named, and the script will extract and order all dimension values.

File names should be consistent except for the variable parts, and the variable parts should be separated somehow. A variable part of the file names representing one dimension is indicated using an asterisk (`*`). For the above example, the pattern would be

```
*-*
```

since there are two variable parts separated using a hyphen, and the script ignores the file extension. The delimiters between values need not be the same: `photo-of-alice_2018@home.jpg` and `photo-of-bob_2019@work.jpg` (etc.) can be parsed using `photo-of-*_*@*`.

The script then allows you to browse through the available dimensions using the -/+ buttons indicated for each dimension, or the keyboard. The keys for the first dimension are under the "1", i.e. on a QWERTY keyboard, "1" itself for one up in this dimension, and "q" for one down. "2" and "w" increase and decrease the second dimension, respectively, and "0" and "p" represent the tenth dimension. The first two dimensions can additionally be controlled by the arrow keys.

Dimensions are numbered in the order that they appear in the file names. The values of each dimension are ordered alphabetically.

Try to make sure all possible combinations are present in the data. If there are gaps, it may not be possible to browse from one file to another.

All processing is done locally within the browser. No images are uploaded or otherwise transmitted through the Internet.

[Click here for a sample dataset](https://mdib.lrk.tools/lakes.zip) containing 144 satellite images arranged in five dimensions: coverage of three lakes in three visual bands, four scales, two years, and two seasons each. Examine, for example, the summer-winter differences at Lakes Urmia and Maharlu, the winter ice coverage difference at Lake Namtso between 2016 and 2019, and how false color bands help interpret the images especially in dry summers. Parse this data using the pattern `*-*-*-*-*`.