// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { json } from 'stream/consumers';
import * as vscode from 'vscode';
import moment from 'moment';
import * as fs from 'fs';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "IssueFixer" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('IssueFixer.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from IssueFixer!');
	});

	let findIssue = vscode.commands.registerCommand('IssueFixer.searchIssue', async () => {
        // 让用户输入仓库名称
        const repoName = await vscode.window.showInputBox({
            prompt: "Enter GitHub Repository (e.g., owner/repo)",
            placeHolder: "e.g., microsoft/vscode",
        });

        if (!repoName) {
            vscode.window.showErrorMessage("Repository name is required.");
            return;
        }

        // 让用户输入 Issue ID
        const issueNumber = await vscode.window.showInputBox({
            prompt: "Enter Issue Number",
            placeHolder: "e.g., 123",
        });

        if (!issueNumber) {
            vscode.window.showErrorMessage("Issue number is required.");
            return;
        }

        vscode.window.showInformationMessage(`Searching issue ${issueNumber} in ${repoName}...`);

        // 调用 API 获取 Issue 数据
        searchIssue(repoName, issueNumber);
    });

    context.subscriptions.push(disposable);
	context.subscriptions.push(findIssue);

}

interface Issue {
    title: string;
    body: string;
    html_url: string;
    [key: string]: any; // 允许任意属性
}

// 获取对象嵌套属性
function getNestedProperty<T>(obj: Issue, property: string): any {
    const parts = property.split('.');
    let result = obj;

    for (let part of parts) {
        if (result && typeof result === 'object' && part in result) {
            result = result[part];
        } else {
            throw new Error(`Path "${property}" is invalid: "${part}" not found.`);
        }
    }

    return result;
}

async function searchIssue(repo: string, issueNumber: string) {
    const url = `https://api.github.com/repos/${repo}/issues/${issueNumber}`;
    
    try {
        const response = await fetch(url, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
        if (!response.ok) { throw new Error(`GitHub API error: ${response.status}`);}

        const issueData = await response.json() as Issue;
		
        vscode.window.showInformationMessage(`Issue Title: ${issueData.title}`);

        // 这里可以把 issueData 发送到 Webview 显示
		// 创建 WebView
        const panel = vscode.window.createWebviewPanel(
            'issueView',
            `Issue #${issueNumber}`,
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        // 格式化Created_at
        const formattedCreatedAt = moment(issueData.created_at).format('YYYY-MM-DD HH:mm:ss');
         // 读取 HTML 模板文件
         const templatePath = path.join(__dirname,'../src/components/', 'webview.html');
         const templateContent = fs.readFileSync(templatePath, 'utf8');

         console.log(issueData.state);
 
         // 替换模板中的变量,p1.trim()用于去除变量名称两边的空格,replace()用于给${x}格式的变量做替换赋值
         const htmlContent = templateContent.replace(/\${(.*?)}/g, (match, p1) => {
            switch (p1.trim()) {
                case 'formatted_created_at':
                    return formattedCreatedAt;
                case 'body':
                    if(issueData.body === '') {
                        return 'No description provided.';
                    }
                    return issueData.body;
                default:
                    return getNestedProperty(issueData, p1.trim()) || match;
            }
         });
 
         panel.webview.html = htmlContent;
    } catch (error) {
		console.log(`error in finding issue : ${error}`);
        vscode.window.showErrorMessage(`Failed to fetch issue: ${error}`);
    }
}
	

// This method is called when your extension is deactivated
export function deactivate() {}
