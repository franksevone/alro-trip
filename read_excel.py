import sys
import zipfile
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8')

with zipfile.ZipFile('สรุปกำหนเการ.xlsx') as z:
    shared_strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for elem in tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
            text = ''.join(t.text for t in elem.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t') if t.text)
            shared_strings.append(text)

    tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    for row in tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
        row_num = row.get('r')
        cells = {}
        for c in row.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
            t = c.get('t')
            v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
            val = v.text if v is not None else ''
            if t == 's' and val.isdigit():
                val = shared_strings[int(val)]
            cells[c.get('r')] = val
        print(f"Row {row_num}: {cells}")
