App Shell (Header, Role Switcher)
├─ /login, /signup
├─ /dashboard
│  ├─ /student
│  │   ├─ PostComposer
│  │   ├─ StudentFeed
│  │   └─ StudentPostCard + TooltipExplainer
│  └─ /community
│      ├─ CommunityList + CreateCommunityModal
│      ├─ CommunityFeed + CommunityPostComposer
│      └─ Collections
│          ├─ CollectionList + CollectionPicker
│          └─ CollectionDetail (grid with include/exclude)
└─ /postcard/[id] (PostcardPreview/Share)
