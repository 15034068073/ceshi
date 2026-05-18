import asyncio
import traceback
from urllib.parse import unquote
from global_vars import GlobalVar
from function import function
import psutil
from threading import Thread
import os
import requests
import sys
import tkinter as tk
from tkinter import ttk, messagebox
import threading
from pathlib import Path
import time
import ctypes
import doubao
import deepseek
import qianwen
import wenxin
import yuanbao
from core.Db import Db
import subprocess
import ai_bind

# pyinstaller main.spec

# ------------------------------
# 全局变量（替代类的实例变量）
# ------------------------------
download_url = ""  # 替换为实际下载地址
download_btn = None  # 下载按钮引用
progress_var = None  # 进度条变量


async def restartable_task(task_func, *args, **kwargs):
    while True:
        try:
            await task_func(*args, **kwargs)
            if task_func.__name__ != "get_cpu":
                function.print_c(f"任务 {task_func.__name__} 正常结束，准备重启...")
        except Exception as e:
            function.print_c(f"\n任务 {task_func.__name__} 报错：{str(e)}")
            GlobalVar.log.error(str(e))
            traceback.print_exc()
            if task_func.__name__ != "get_cpu":
                function.print_c(f"任务 {task_func.__name__} 1秒后重启...\n")
        await asyncio.sleep(1)


def run_task_in_thread(coroutine, thread_name):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        function.print_c(f"线程 {thread_name} 启动，开始运行任务")
        loop.run_until_complete(coroutine)
    finally:
        loop.close()
        function.print_c(f"线程 {thread_name} 事件循环关闭")


async def get_cpu():
    cpu_percent = psutil.cpu_percent(interval=1)
    GlobalVar.cpu_info["usage"] = cpu_percent
    main_window.after(0, lambda: GlobalVar.cpu_info["label"].config(text=f"{cpu_percent}%"))
    main_window.after(0, lambda: GlobalVar.cpu_info["progress"].config(value=cpu_percent))
    refresh_now_data()  # 刷新现有的数据，不从数据库拿
    await asyncio.sleep(1)


def start_async_tasks():
    """启动所有异步任务（每个任务在独立线程中运行）"""
    task_list = [
        (get_cpu, "CPU使用率"),
        # (doubao.doubao_task, "豆包查询任务"),
        # (deepseek.deepseek_task, "deepseek查询任务"),
        # (qianwen.qianwen_task, "通义千问查询任务"),
        # (wenxin.wenxin_task, "文心一言查询任务"),
        # (yuanbao.yuanbao_task, "腾讯元宝查询任务"),
        (check_single_login_task, "检测登录"),
    ]
    start_task_batch(task_list)


def start_task_batch(task_list, index=0):
    """分批启动任务，间隔3秒"""
    if index >= len(task_list):
        return

    task_func, task_name = task_list[index]
    restartable_coroutine = restartable_task(task_func)
    thread = threading.Thread(
        target=run_task_in_thread,
        args=(restartable_coroutine, task_name),
        name=task_name,
        daemon=True,
    )
    thread.start()
    main_window.after(3000, start_task_batch, task_list, index + 1)


def force_update_and_restart(new_exe_path):
    old_exe = os.path.abspath(sys.argv[0])
    new_exe = os.path.abspath(new_exe_path)
    bat_path = os.path.join(os.path.dirname(old_exe), "update_and_restart.bat")
    bat_content = f"""@echo off
timeout /t 2 /nobreak >nul
del /f /q "{old_exe}" >nul 2>nul
start "" "{new_exe}"
del /f /q "%~f0"
"""
    with open(bat_path, "w", encoding="gbk") as f:
        f.write(bat_content)
    create_no_window = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    subprocess.Popen(["cmd", "/c", bat_path], creationflags=create_no_window)
    os._exit(0)


def start_download():
    """启动下载（在子线程中执行）"""
    global download_btn, progress_var
    download_btn.config(state="disabled")
    progress_var.set(0)
    threading.Thread(target=download_file, daemon=True).start()


def download_file():
    global download_url, download_btn, progress_var, login_window
    try:
        with requests.get(download_url, stream=True) as response:
            response.raise_for_status()
            raw_file_name = download_url.split("/")[-1].split("?")[0]
            decoded_file_name = unquote(raw_file_name, encoding="utf-8", errors="replace")
            if not decoded_file_name:
                decoded_file_name = "GEO查询小助手.exe"
            invalid_chars = ':*?"<>|/\\'
            for c in invalid_chars:
                decoded_file_name = decoded_file_name.replace(c, "_")

            app_dir = os.path.dirname(os.path.abspath(sys.argv[0]))
            file_name = os.path.join(app_dir, decoded_file_name)
            total_size = int(response.headers.get("content-length", 0))
            downloaded_size = 0

            with open(file_name, "wb") as f:
                for chunk in response.iter_content(chunk_size=1024 * 10):
                    if chunk:
                        f.write(chunk)
                        downloaded_size += len(chunk)
                        if total_size > 0:
                            progress = (downloaded_size / total_size) * 100
                            login_window.after(0, lambda p=progress: progress_var.set(p))

        login_window.after(0, lambda: force_update_and_restart(file_name))
    except Exception as e:
        login_window.after(0, lambda err=e: messagebox.showerror("错误", f"下载失败：\n{str(err)}"))
        GlobalVar.log.error(str(e))
    finally:
        login_window.after(0, lambda: download_btn.config(state="normal"))


def run_async_loop():
    """在独立线程中运行异步事件循环"""
    global loop
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        function.print_c("异步事件循环已启动")
        loop.run_forever()
    except Exception as e:
        function.print_c(f"事件循环运行出错：{str(e)}")
        GlobalVar.log.error(f"事件循环运行出错：{str(e)}")
    finally:
        try:
            if loop and not loop.is_closed():
                loop.close()
                function.print_c("事件循环已安全关闭")
        except Exception:
            pass


def show_main():
    async_thread = Thread(target=run_async_loop, daemon=True)
    async_thread.start()
    time.sleep(1)
    global cpu_info, main_window
    """主页面（左侧任务两列 + 右侧日志，左右各占一半）"""
    main_window = tk.Tk()
    main_window.protocol("WM_DELETE_WINDOW", on_window_close)
    main_window.title("GEO查询小助手")
    main_window.geometry("800x700")
    main_window.configure(bg="#f5f7fa")
    main_window.resizable(False, False)

    header_frame = tk.Frame(main_window, bg="#4361EE", height=60)
    header_frame.pack(fill=tk.X)
    header_frame.pack_propagate(False)

    title_frame = tk.Frame(header_frame, bg="#4361EE")
    title_frame.pack(side=tk.LEFT, padx=20, pady=10)
    title_label = tk.Label(
        title_frame,
        text=f"GEO查询小助手{GlobalVar.config['version_number']}",
        bg="#4361EE",
        fg="white",
        font=("Microsoft YaHei", 14, "bold"),
    )
    title_label.pack(side=tk.LEFT)

    status_label = tk.Label(
        header_frame,
        text=GlobalVar.user_info["name"] + " " + GlobalVar.user_info["phone"],
        bg="#4361EE",
        fg="white",
        font=("Microsoft YaHei", 10),
    )
    status_label.pack(side=tk.RIGHT, padx=20)

    # 主内容区域：左侧任务与CPU（1/2），右侧日志（1/2）
    main_frame = ttk.Frame(main_window, style="Main.TFrame")
    main_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
    main_frame.grid_columnconfigure(0, weight=1, uniform="half")
    main_frame.grid_columnconfigure(1, weight=1, uniform="half")
    main_frame.grid_rowconfigure(0, weight=1)

    left_frame = ttk.Frame(main_frame)
    left_frame.grid(row=0, column=0, sticky="nsew", padx=(0, 8))

    right_frame = ttk.Frame(main_frame)
    right_frame.grid(row=0, column=1, sticky="nsew", padx=(8, 0))

    # 左侧上部：任务卡片两列（左3右2）
    task_grid_frame = ttk.Frame(left_frame)
    task_grid_frame.pack(fill=tk.BOTH, expand=True)

    left_col = ttk.Frame(task_grid_frame)
    left_col.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 4))
    right_col = ttk.Frame(task_grid_frame)
    right_col.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=(4, 0))

    create_task_card(left_col, "豆包", "doubao")
    create_task_card(left_col, "通义千问", "qianwen")
    create_task_card(left_col, "腾讯元宝", "yuanbao")

    create_task_card(right_col, "deepseek", "deepseek")
    create_task_card(right_col, "文心一言", "wenxin")

    # 左侧下部：CPU使用率卡片
    create_cpu_card(left_frame)

    # 右侧日志面板
    log_title_frame = tk.Frame(right_frame, bg="white")
    log_title_frame.pack(fill=tk.X)

    def on_log_click(event):
        print("你点击了运行日志！")
        log_path = Path.home() / "Documents" / "qibangshou" / "logs"
        os.startfile(log_path)

    log_label = tk.Label(
        log_title_frame,
        text="📜 运行日志",
        bg="white",
        font=("Microsoft YaHei", 12, "bold"),
        cursor="hand2",
    )
    log_label.pack(side=tk.LEFT, padx=15, pady=10)
    log_label.bind("<Button-1>", on_log_click)

    GlobalVar.log_text = tk.Text(
        right_frame,
        bg="white",
        font=("Microsoft YaHei", 10),
        wrap=tk.WORD,
        state=tk.DISABLED,
        relief=tk.RIDGE,
        bd=1,
    )
    GlobalVar.log_text.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

    scrollbar = ttk.Scrollbar(GlobalVar.log_text, orient=tk.VERTICAL, command=GlobalVar.log_text.yview)
    scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
    GlobalVar.log_text.configure(yscrollcommand=scrollbar.set)

    btn_frame = tk.Frame(main_window, bg="#f5f7fa")
    btn_frame.pack(fill=tk.X, padx=20, pady=10)

    def bind_ai_account():
        bind_window = tk.Toplevel()
        bind_window.title("绑定AI账号")
        bind_window.geometry("650x150")
        bind_window.resizable(False, False)
        bind_window.configure(bg="#f5f7fa")
        tk.Label(bind_window, text="请选择要绑定的AI平台", bg="#f5f7fa", font=("Microsoft YaHei", 12, "bold")).pack(pady=20)
        btn_frame = tk.Frame(bind_window, bg="#f5f7fa")
        btn_frame.pack(pady=10)

        tk.Button(
            btn_frame,
            text="绑定豆包",
            bg="#4361EE",
            fg="white",
            font=("Microsoft YaHei", 10),
            width=12,
            command=lambda: [ai_bind.bind_doubao(), bind_window.destroy()],
        ).pack(side=tk.LEFT, padx=10)

        tk.Button(
            btn_frame,
            text="绑定deepseek",
            bg="#4361EE",
            fg="white",
            font=("Microsoft YaHei", 10),
            width=12,
            command=lambda: [ai_bind.bind_deepseek(), bind_window.destroy()],
        ).pack(side=tk.LEFT, padx=10)

        tk.Button(
            btn_frame,
            text="绑定文心一言",
            bg="#4361EE",
            fg="white",
            font=("Microsoft YaHei", 10),
            width=12,
            command=lambda: [ai_bind.bind_wenxin(), bind_window.destroy()],
        ).pack(side=tk.LEFT, padx=10)

        tk.Button(
            btn_frame,
            text="绑定千问",
            bg="#4361EE",
            fg="white",
            font=("Microsoft YaHei", 10),
            width=12,
            command=lambda: [ai_bind.bind_qianwen(), bind_window.destroy()],
        ).pack(side=tk.LEFT, padx=10)

        tk.Button(
            btn_frame,
            text="绑定元宝",
            bg="#4361EE",
            fg="white",
            font=("Microsoft YaHei", 10),
            width=12,
            command=lambda: [ai_bind.bind_yuanbao(), bind_window.destroy()],
        ).pack(side=tk.LEFT, padx=10)
        bind_window.protocol("WM_DELETE_WINDOW", bind_window.destroy)

    refresh_btn = tk.Button(
        btn_frame,
        text="🔗 绑定查询账号",
        bg="#4361EE",
        fg="white",
        font=("Microsoft YaHei", 10, "bold"),
        relief=tk.RAISED,
        bd=0,
        padx=20,
        pady=8,
        command=lambda: bind_ai_account(),
    )
    refresh_btn.pack(side=tk.LEFT, padx=5)

    refresh_btn = tk.Button(
        btn_frame,
        text="↻ 刷新任务数据",
        bg="#4361EE",
        fg="white",
        font=("Microsoft YaHei", 10, "bold"),
        relief=tk.RAISED,
        bd=0,
        padx=20,
        pady=8,
        command=lambda: start_refresh_async(),
    )
    refresh_btn.pack(side=tk.LEFT, padx=5)

    def toggle_function():
        if GlobalVar.config["headless"]:
            GlobalVar.config["headless"] = False
            toggle_btn.config(text="关闭浏览器")
            function.log_insert("浏览器已开启")
        else:
            GlobalVar.config["headless"] = True
            toggle_btn.config(text="开启浏览器")
            function.log_insert("浏览器已关闭")

    if GlobalVar.config["headless"] is True:
        chorme_status = "开启浏览器"
    else:
        chorme_status = "关闭浏览器"

    toggle_btn = tk.Button(
        btn_frame,
        text=chorme_status,
        bg="#2196f3",
        fg="white",
        font=("Microsoft YaHei", 10, "bold"),
        relief=tk.RAISED,
        bd=0,
        padx=20,
        pady=8,
        command=toggle_function,
    )
    toggle_btn.pack(side=tk.LEFT, padx=5)

    start_refresh_async()
    start_async_tasks()
    main_window.mainloop()


def start_refresh_async():
    """启动异步刷新任务（在 Tkinter 主线程中调度）"""
    import warnings

    warnings.filterwarnings("ignore", category=UserWarning)
    warnings.filterwarnings("ignore", message="libpng warning")

    global loop
    try:
        if "loop" in globals() and loop and loop.is_running():
            asyncio.run_coroutine_threadsafe(refresh_data(), loop)
            function.print_c("异步刷新任务已调度")
        else:
            function.print_c("事件循环未就绪，创建新的异步任务线程")

            async def temp_refresh():
                await refresh_data()

            thread = threading.Thread(target=lambda: asyncio.run(temp_refresh()), daemon=True)
            thread.start()
    except Exception as e:
        function.print_c(f"调度异步任务时出错：{str(e)}")
        GlobalVar.log.error(f"调度异步任务时出错：{str(e)}")


def on_window_close(prefix="qbs_hk_helper"):
    if "login_window" in globals() and login_window:
        try:
            if login_window.winfo_exists():
                login_window.destroy()
        except Exception as e:
            GlobalVar.log.error(str(e))
    if "main_window" in globals() and main_window:
        try:
            if main_window.winfo_exists():
                main_window.destroy()
        except Exception as e:
            GlobalVar.log.error(str(e))


def show_login():
    """登录窗口（全局变量管理界面元素）"""
    global download_btn, progress_var, login_window, download_url

    login_window = tk.Tk()
    login_window.protocol("WM_DELETE_WINDOW", on_window_close)
    login_window.title("GEO查询小助手")
    login_window.geometry("500x350")
    login_window.resizable(False, False)

    tk.Label(login_window, text="GEO查询小助手", font=("微软雅黑", 16, "bold")).pack(pady=30)
    os_type = function.check_os()
    if os_type == 1:
        new_version_res = function.post_form("/python/getVersion", {"type": 1, "platform": 1}, timeout=60)
    else:
        new_version_res = function.post_form("/python/getVersion", {"type": 1, "platform": 2}, timeout=60)
    print(new_version_res)
    if new_version_res["success"]:
        download_url = new_version_res["response_text"]["download_url"]
    if new_version_res["response_text"]["version_number"] == GlobalVar.config["version_number"]:
        uu_id = function.get_machine_uuid()
        print("uu_id:", uu_id)
        douyin_uuid_res = function.post_form("/python/getUuidInfo", {"uuid": uu_id}, timeout=60)
        print(douyin_uuid_res)
        uuid_data = None
        if douyin_uuid_res["success"]:
            uuid_data = douyin_uuid_res["response_text"]
        print("uuid_data:", uuid_data)

        frame_account = tk.Frame(login_window)
        frame_account.pack(pady=10)
        tk.Label(frame_account, text="账户", font=("微软雅黑", 10)).pack(side=tk.LEFT, padx=20)
        entry_account = tk.Entry(frame_account, width=30, font=("微软雅黑", 10))
        entry_account.pack(side=tk.LEFT)
        if uuid_data and uuid_data["account"]:
            entry_account.insert(0, uuid_data["account"])

        frame_pwd = tk.Frame(login_window)
        frame_pwd.pack(pady=10)
        tk.Label(frame_pwd, text="密码", font=("微软雅黑", 10)).pack(side=tk.LEFT, padx=20)
        entry_pwd = tk.Entry(frame_pwd, width=30, show="*", font=("微软雅黑", 10))
        entry_pwd.pack(side=tk.LEFT)
        if uuid_data and uuid_data["password"]:
            entry_pwd.insert(0, uuid_data["password"])

        def login():
            account = entry_account.get().strip()
            pwd = entry_pwd.get().strip()
            if not account or not pwd:
                messagebox.showwarning("提示", "请输入账户和密码！")
                return

            user = function.post_form("/client/loginByPy", {"phone": account, "password": pwd})
            if user["success"] is True and user["status_code"] == 200:
                GlobalVar.token = user["response_text"]["token"]
                GlobalVar.user_info = user["response_text"]["user"]
                print({"uuid": uu_id, "account": account, "password": pwd})
                res = function.post_form(
                    "/python/upsertUuidData",
                    {"uuid": uu_id, "account": account, "password": pwd},
                    timeout=60,
                )
                print("res", res)
                login_window.destroy()
                show_main()
            else:
                messagebox.showwarning("提示", "账户或密码错误！")

        tk.Button(
            login_window,
            text="登录",
            command=login,
            width=15,
            height=2,
            font=("微软雅黑", 10),
        ).pack(pady=30)
    else:
        tk.Label(login_window, text="有新版本更新，请点击下方按钮开始下载", font=("微软雅黑", 10)).pack(pady=10)
        progress_var = tk.DoubleVar()
        progress_bar = ttk.Progressbar(login_window, variable=progress_var, maximum=100, length=300)
        progress_bar.pack(pady=20)
        download_btn = tk.Button(
            login_window,
            text="开始下载",
            command=start_download,
            width=15,
            height=2,
            font=("微软雅黑", 10),
        )
        download_btn.pack(pady=10)

    login_window.mainloop()


def create_task_card(parent, title, task_key):
    """创建任务数据卡片（返回标签引用以便刷新）"""
    card = tk.Frame(parent, bg="white", relief=tk.RIDGE, bd=1)
    card.pack(fill=tk.X, pady=5, padx=5)

    main_frame = tk.Frame(card, bg="white")
    main_frame.pack(fill=tk.X, padx=15, pady=10)

    title_frame = tk.Frame(main_frame, bg="white", width=80)
    title_frame.pack(side=tk.LEFT, fill=tk.Y)
    title_frame.pack_propagate(False)
    title_label = tk.Label(title_frame, text=title, bg="white", font=("Microsoft YaHei", 12, "bold"))
    title_label.pack(side=tk.LEFT)

    pending_frame = tk.Frame(main_frame, bg="white")
    pending_frame.pack(side=tk.LEFT, expand=True, fill=tk.X)
    pending_frame.grid_columnconfigure(0, weight=1)
    tk.Label(pending_frame, text="待执行", bg="white", fg="#6C757D", font=("Microsoft YaHei", 10)).grid(
        row=0, column=0, sticky="nsew"
    )
    pending_label = tk.Label(
        pending_frame,
        text=str(GlobalVar.task_info[task_key]["pending"]),
        bg="white",
        fg="#FF9F1C",
        font=("Microsoft YaHei", 10, "bold"),
    )
    pending_label.grid(row=1, column=0, sticky="nsew")

    GlobalVar.task_info[task_key]["labels"] = {"pending": pending_label}


def create_comment_card(parent):
    """创建评论处理卡片（返回标签引用以便刷新）"""
    card = tk.Frame(parent, bg="white", relief=tk.RIDGE, bd=1)
    card.pack(fill=tk.X, pady=5, padx=5)
    title_frame = tk.Frame(card, bg="white")
    title_frame.pack(fill=tk.X, padx=15, pady=10)


def create_cpu_card(parent):
    """创建CPU使用率卡片"""
    card = tk.Frame(parent, bg="white", relief=tk.RIDGE, bd=1)
    card.pack(fill=tk.X, pady=5, padx=5)

    title_frame = tk.Frame(card, bg="white")
    title_frame.pack(fill=tk.X, padx=15, pady=10)

    title_label = tk.Label(title_frame, text="CPU 使用率", bg="white", font=("Microsoft YaHei", 12, "bold"))
    title_label.pack(side=tk.LEFT)

    cpu_value_label = tk.Label(
        title_frame,
        text=f"{GlobalVar.cpu_info['usage']}%",
        bg="white",
        fg="#E63946",
        font=("Microsoft YaHei", 10, "bold"),
    )
    cpu_value_label.pack(side=tk.RIGHT)

    cpu_progress = ttk.Progressbar(card, orient=tk.HORIZONTAL, length=250, mode="determinate")
    cpu_progress["value"] = GlobalVar.cpu_info["usage"]
    cpu_progress.pack(padx=15, pady=(0, 15))

    style = ttk.Style()
    style.configure("red.Horizontal.TProgressbar", troughcolor="#E9ECEF", background="#E63946")
    cpu_progress.configure(style="red.Horizontal.TProgressbar")

    GlobalVar.cpu_info["label"] = cpu_value_label
    GlobalVar.cpu_info["progress"] = cpu_progress


def refresh_now_data():
    """刷新所有数据（CPU + 任务数 + 评论数）"""
    task_info = GlobalVar.task_info
    task_types = ["doubao", "deepseek", "qianwen", "wenxin", "yuanbao"]
    for task_type in task_types:
        task_info[task_type]["labels"]["pending"].config(text=str(GlobalVar.task_info[task_type]["pending"]))


async def refresh_data():
    created_time = int(time.time()) - 86400 * 3
    doubao_count = Db("reports").count(
        f"customer_id = {GlobalVar.user_info['id']} and type = 1 and platform = 1 and query_time IS NULL and created_at < {created_time}"
    )
    deepseek_count = Db("reports").count(
        f"customer_id = {GlobalVar.user_info['id']} and type = 2 and platform = 1 and query_time IS NULL and created_at < {created_time}"
    )
    qianwen_count = Db("reports").count(
        f"customer_id = {GlobalVar.user_info['id']} and type = 3 and platform = 1 and query_time IS NULL and created_at < {created_time}"
    )
    wenxin_count = Db("reports").count(
        f"customer_id = {GlobalVar.user_info['id']} and type = 4 and platform = 1 and query_time IS NULL and created_at < {created_time}"
    )
    yuanbao_count = Db("reports").count(
        f"customer_id = {GlobalVar.user_info['id']} and type = 5 and platform = 1 and query_time IS NULL and created_at < {created_time}"
    )

    GlobalVar.task_info["doubao"]["total"] = int(doubao_count)
    GlobalVar.task_info["doubao"]["executed"] = 0
    GlobalVar.task_info["doubao"]["pending"] = int(doubao_count)

    GlobalVar.task_info["deepseek"]["total"] = int(deepseek_count)
    GlobalVar.task_info["deepseek"]["executed"] = 0
    GlobalVar.task_info["deepseek"]["pending"] = int(deepseek_count)

    GlobalVar.task_info["qianwen"]["total"] = int(qianwen_count)
    GlobalVar.task_info["qianwen"]["executed"] = 0
    GlobalVar.task_info["qianwen"]["pending"] = int(qianwen_count)

    GlobalVar.task_info["wenxin"]["total"] = int(wenxin_count)
    GlobalVar.task_info["wenxin"]["executed"] = 0
    GlobalVar.task_info["wenxin"]["pending"] = int(wenxin_count)

    GlobalVar.task_info["yuanbao"]["total"] = int(yuanbao_count)
    GlobalVar.task_info["yuanbao"]["executed"] = 0
    GlobalVar.task_info["yuanbao"]["pending"] = int(yuanbao_count)


async def check_single_login_task():
    await asyncio.sleep(15)


def prevent_sleep():
    ctypes.windll.kernel32.SetThreadExecutionState(0x80000001 | 0x00000002)


if __name__ == "__main__":
    prevent_sleep()
    GlobalVar.log = function.init_logger()
    if getattr(sys, "frozen", False):
        bundle_dir = sys._MEIPASS
        chrome_path = os.path.join(bundle_dir, "chromium-1091", "chrome-win", "chrome.exe")
    else:
        bundle_dir = os.path.abspath(".")
        chrome_path = os.path.join(bundle_dir, "chromium-1091", "chrome-win", "chrome.exe")

    os.environ["PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH"] = chrome_path
    show_login()
