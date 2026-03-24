const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('d:/EAFWW/mtih learn/src/app');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Fix Supabase select queries: e.g. profiles!...(full_name) -> profiles!...(first_name, last_name)
    const queryRegex = /profiles(![^\(]+)?\([^)]*full_name[^)]*\)/g;
    content = content.replace(queryRegex, (match) => {
        changed = true;
        return match.replace(/full_name/g, 'first_name, last_name');
    });

    // Fix other Supabase select queries: "select('id, full_name, bio')"
    const queryRegex2 = /"id,\s*full_name,\s*bio"/g;
    if (content.match(queryRegex2)) {
        changed = true;
        content = content.replace(queryRegex2, '"id, first_name, last_name, bio"');
    }

    // Settings page formData.full_name -> formData.first_name, formData.last_name
    if (file.includes('settings\\page.tsx')) {
        changed = true;
        content = content.replace(/full_name:\s*""/g, 'first_name: "", last_name: ""');
        content = content.replace(/full_name:\s*profile\.full_name\s*\|\|\s*""/g, 'first_name: profile.first_name || "", last_name: profile.last_name || ""');
        content = content.replace(/full_name:\s*formData\.full_name/g, 'first_name: formData.first_name, last_name: formData.last_name');
        content = content.replace(/formData\.full_name\?\.\[0\]/g, 'formData.first_name?.[0]');
        content = content.replace(/formData\.full_name\s*\|\|/g, '(formData.first_name ? formData.first_name + " " + formData.last_name : "") ||');
        content = content.replace(/name="full_name"/g, 'name="first_name" placeholder="First Name" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} className="..." />\n<input name="last_name" placeholder="Last Name"');
        // Will need manual fix for settings page input field later
    }

    // JSX Rendering replacements for generic objects (obj.full_name)
    // We want to replace `obj.full_name` with `(obj.first_name ? obj.first_name + ' ' + (obj.last_name || '') : '')` 
    // Wait, regex might be tricky. Let's do some common ones.
    const propRegex = /([a-zA-Z0-9_\.\?]+)\.full_name/g;
    content = content.replace(propRegex, (match, prefix) => {
        if (prefix === 'formData') return match; // Handled above
        changed = true;
        // e.g. prefix is `project.profiles?`
        // we replace `project.profiles?.full_name` with `${prefix}.first_name} ${prefix}.last_name`
        // Since this is often inside JSX {}, we need to be careful.
        // Actually, let's just use a getter-like approach or inline expression.
        return `(${prefix}.first_name ? \`\${${prefix}.first_name} \${${prefix}.last_name || ''}\`.trim() : "")`;
    });

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Processed:', file);
    }
});
