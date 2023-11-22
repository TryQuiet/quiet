export interface TextWithLinkProps {
    text: string
    tagPrefix?: string
    links: [
        {
            tag: string
            label: string
            action: () => void
        }
    ]
}
