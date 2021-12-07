def get_page_num(request):
    try:
        page_num = request.args.get('pn')
        if page_num is not None:
            return int(page_num)
        else:
            return 1
    except:
        raise ValueError("Page number is invalid")

def get_page_size(request):
    try:
        page_size = request.args.get('ps')
        if page_size is not None:
            return int(page_size)
        else:
            return 12
    except:
        raise ValueError("Page size is invalid")

def get_review_page_size(request):
    try:
        page_size = request.args.get('ps')
        if page_size is not None:
            return int(page_size)
        else:
            return 6
    except:
        raise ValueError("Page size is invalid")

def get_page_start(request):
    page_num = get_page_num(request)
    page_size = get_page_size(request)
    page_start = (page_size * ( page_num - 1 ))

    return page_start

def get_review_page_start(request):
    page_num = get_page_num(request)
    page_size = get_review_page_size(request)
    page_start = (page_size * ( page_num - 1 ))

    return page_start